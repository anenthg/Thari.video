import type { AppSettings } from '../types'
import type { ProvisioningStep, StepUpdateCallback } from './types'
import { createZipBuffer } from './zip-builder'

export const CLOUD_FUNCTION_VERSION = '1.0.2'

// ---------------------------------------------------------------------------
// Embedded Cloud Function source (v1 SDK -- works on both 1st & 2nd gen)
// ---------------------------------------------------------------------------

const FUNCTION_INDEX_JS = `
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const DB_ID = process.env.FIRESTORE_DB_ID || "(default)";
function getDb() {
  if (DB_ID && DB_ID !== "(default)") {
    return admin.firestore().databaseId === DB_ID
      ? admin.firestore()
      : require("firebase-admin/firestore").getFirestore(admin.app(), DB_ID);
  }
  return admin.firestore();
}

function json(res, data, status) {
  status = status || 200;
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.status(status).json(data);
}

exports.openloom = functions.https.onRequest(function (req, res) {
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).send("");
    return;
  }

  var db = getDb();
  var path = req.path;

  // GET /v/:code
  var videoMatch = path.match(/^\\/v\\/([\\w-]+)$/);
  if (videoMatch && req.method === "GET") {
    var code = videoMatch[1];
    return db.collection("videos").doc(code).get().then(function (doc) {
      if (!doc.exists) return json(res, { error: "Video not found" }, 404);
      json(res, doc.data());
    }).catch(function (e) { json(res, { error: e.message }, 500); });
  }

  // POST /v/:code/view
  var viewMatch = path.match(/^\\/v\\/([\\w-]+)\\/view$/);
  if (viewMatch && req.method === "POST") {
    var code2 = viewMatch[1];
    var ref = db.collection("videos").doc(code2);
    return ref.get().then(function (doc) {
      if (!doc.exists) return json(res, { error: "Video not found" }, 404);
      return ref.update({ view_count: admin.firestore.FieldValue.increment(1) })
        .then(function () { json(res, { ok: true }); });
    }).catch(function (e) { json(res, { error: e.message }, 500); });
  }

  // GET /v/:code/reactions
  var reactionsMatch = path.match(/^\\/v\\/([\\w-]+)\\/reactions$/);
  if (reactionsMatch && req.method === "GET") {
    var code3 = reactionsMatch[1];
    return db.collection("videos").doc(code3).collection("reactions")
      .orderBy("created_at", "asc").get()
      .then(function (snapshot) {
        var reactions = snapshot.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
        json(res, reactions);
      }).catch(function (e) { json(res, { error: e.message }, 500); });
  }

  // POST /v/:code/reactions
  if (reactionsMatch && req.method === "POST") {
    var code4 = reactionsMatch[1];
    var body = req.body || {};
    if (!body.emoji || typeof body.timestamp !== "number") {
      return json(res, { error: "emoji and timestamp are required" }, 400);
    }
    return db.collection("videos").doc(code4).collection("reactions")
      .add({ emoji: body.emoji, timestamp: body.timestamp, created_at: admin.firestore.FieldValue.serverTimestamp() })
      .then(function (docRef) {
        return docRef.get().then(function (created) {
          json(res, Object.assign({ id: docRef.id }, created.data()), 201);
        });
      }).catch(function (e) { json(res, { error: e.message }, 500); });
  }

  json(res, { error: "Not found" }, 404);
});
`.trim()

const FUNCTION_PACKAGE_JSON = JSON.stringify(
  {
    name: 'openloom-cloud-function',
    version: '1.0.0',
    private: true,
    main: 'index.js',
    engines: { node: '20' },
    dependencies: {
      'firebase-admin': '^12.0.0',
      'firebase-functions': '^4.9.0',
    },
  },
  null,
  2,
)

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

function log(msg: string, data?: unknown): void {
  const ts = new Date().toISOString()
  if (data !== undefined) {
    console.log(`[deploy-cf ${ts}] ${msg}`, data)
  } else {
    console.log(`[deploy-cf ${ts}] ${msg}`)
  }
}

// ---------------------------------------------------------------------------
// JWT auth via SubtleCrypto (browser-compatible, replaces admin.credential.cert)
// ---------------------------------------------------------------------------

function base64UrlEncode(data: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlEncodeString(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN [\w\s]+-----/, '')
    .replace(/-----END [\w\s]+-----/, '')
    .replace(/\s/g, '')
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

async function getAccessToken(serviceAccountJson: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson)
  log(`Getting access token for SA: ${sa.client_email}, project: ${sa.project_id}`)

  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }

  const headerB64 = base64UrlEncodeString(JSON.stringify(header))
  const payloadB64 = base64UrlEncodeString(JSON.stringify(payload))
  const unsigned = `${headerB64}.${payloadB64}`

  // Import the RSA private key
  const keyData = pemToArrayBuffer(sa.private_key)
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  // Sign the JWT
  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsigned),
  )
  const signature = base64UrlEncode(new Uint8Array(signatureBuffer))
  const jwt = `${unsigned}.${signature}`

  // Exchange JWT for access token
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to get access token: ${res.status} ${text}`)
  }

  const data = (await res.json()) as { access_token: string }
  log(`Access token obtained (${data.access_token.substring(0, 20)}...)`)
  return data.access_token
}

// ---------------------------------------------------------------------------
// DeployActionError
// ---------------------------------------------------------------------------

class DeployActionError extends Error {
  enableUrls: { label: string; url: string }[]
  constructor(message: string, enableUrls: { label: string; url: string }[]) {
    super(message)
    this.enableUrls = enableUrls
  }
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

const REQUIRED_APIS: { name: string; label: string; slug: string }[] = [
  { name: 'cloudfunctions.googleapis.com', label: 'Cloud Functions API', slug: 'cloudfunctions.googleapis.com' },
  { name: 'cloudbuild.googleapis.com', label: 'Cloud Build API', slug: 'cloudbuild.googleapis.com' },
  { name: 'artifactregistry.googleapis.com', label: 'Artifact Registry API', slug: 'artifactregistry.googleapis.com' },
  { name: 'run.googleapis.com', label: 'Cloud Run Admin API', slug: 'run.googleapis.com' },
]

async function resolveProjectNumber(token: string, projectId: string): Promise<string> {
  const url = `https://cloudresourcemanager.googleapis.com/v1/projects/${projectId}`
  log(`Resolving project number for: ${projectId}`)
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const body = await res.text()
    log(`Failed to resolve project number: ${res.status} ${res.statusText}`, body)
    return projectId // fallback to project ID string
  }
  const data = (await res.json()) as { projectNumber?: string }
  log(`Project number resolved: ${data.projectNumber}`)
  return data.projectNumber || projectId
}

async function enableApi(
  token: string,
  projectIdentifier: string,
  apiName: string,
): Promise<{ ok: boolean; status: number; error?: string }> {
  const url = `https://serviceusage.googleapis.com/v1/projects/${projectIdentifier}/services/${apiName}:enable`
  log(`Enabling API: ${apiName} via ${url}`)
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  })
  if (!res.ok) {
    const body = await res.text()
    log(`Enable API ${apiName} failed: ${res.status} ${res.statusText}`, body)
    return { ok: false, status: res.status, error: body }
  }
  const body = await res.json()
  log(`Enable API ${apiName} succeeded`, body)
  return { ok: true, status: res.status }
}

async function checkDisabledApis(token: string, projectId: string): Promise<{ label: string; url: string }[]> {
  const disabled: { label: string; url: string }[] = []
  for (const api of REQUIRED_APIS) {
    try {
      const url = `https://serviceusage.googleapis.com/v1/projects/${projectId}/services/${api.name}`
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const body = (await res.json()) as { state?: string }
        if (body.state !== 'ENABLED') {
          disabled.push({
            label: `Enable ${api.label}`,
            url: `https://console.cloud.google.com/apis/library/${api.slug}?project=${projectId}`,
          })
        }
      } else {
        disabled.push({
          label: `Enable ${api.label}`,
          url: `https://console.cloud.google.com/apis/library/${api.slug}?project=${projectId}`,
        })
      }
    } catch {
      disabled.push({
        label: `Enable ${api.label}`,
        url: `https://console.cloud.google.com/apis/library/${api.slug}?project=${projectId}`,
      })
    }
  }
  return disabled
}

function apiNotEnabledErrorFromActions(actions: { label: string; url: string }[]): DeployActionError {
  return new DeployActionError(
    'Required APIs are not enabled. Please enable them in the GCP Console, then retry.',
    actions,
  )
}

function apiNotEnabledErrorAll(projectId: string): DeployActionError {
  return new DeployActionError(
    'Required APIs are not enabled. Please enable them in the GCP Console, then retry.',
    REQUIRED_APIS.map((api) => ({
      label: `Enable ${api.label}`,
      url: `https://console.cloud.google.com/apis/library/${api.slug}?project=${projectId}`,
    })),
  )
}

function missingRoleError(projectId: string, saEmail: string): DeployActionError {
  return new DeployActionError(
    `The service account ${saEmail} is missing required IAM roles. ` +
    `Grant "Cloud Functions Developer", "Service Account User", and "Cloud Run Admin", then retry.`,
    [
      {
        label: 'Open IAM Settings',
        url: `https://console.cloud.google.com/iam-admin/iam?project=${projectId}`,
      },
    ],
  )
}

async function tryEnableApis(token: string, projectId: string): Promise<void> {
  const projectNumber = await resolveProjectNumber(token, projectId)
  log(`Using project identifier for Service Usage: ${projectNumber} (original: ${projectId})`)

  for (const api of REQUIRED_APIS.map((a) => a.name)) {
    let result = await enableApi(token, projectNumber, api)
    if (!result.ok && projectNumber !== projectId) {
      result = await enableApi(token, projectId, api)
    }
    if (result.ok) {
      log(`Successfully enabled ${api}`)
    } else {
      log(`Could not enable ${api} (SA lacks permission) -- will attempt deployment anyway`)
    }
  }
}

async function checkCloudFunctionsAccess(
  token: string,
  projectId: string,
  saEmail: string,
): Promise<void> {
  const listUrl = `https://cloudfunctions.googleapis.com/v2/projects/${projectId}/locations/us-central1/functions`
  log(`Checking Cloud Functions v2 access: ${listUrl}`)
  const res = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const body = await res.text()
  log(`Cloud Functions v2 access check: ${res.status}`, body.substring(0, 500))

  if (res.ok) return

  const isHtml = body.toLowerCase().includes('<!doctype') || body.toLowerCase().includes('<html')

  if (isHtml) {
    log('HTML response -- API not enabled, checking which APIs are disabled...')
    const disabled = await checkDisabledApis(token, projectId)
    throw disabled.length > 0
      ? apiNotEnabledErrorFromActions(disabled)
      : apiNotEnabledErrorAll(projectId)
  }

  if (res.status === 403) {
    const lowerBody = body.toLowerCase()
    if (lowerBody.includes('has not been used') || lowerBody.includes('is disabled')) {
      log('API not enabled (JSON 403), checking which APIs are disabled...')
      const disabled = await checkDisabledApis(token, projectId)
      throw disabled.length > 0
        ? apiNotEnabledErrorFromActions(disabled)
        : apiNotEnabledErrorAll(projectId)
    }
    log('API enabled but SA lacks Cloud Functions permissions')
    throw missingRoleError(projectId, saEmail)
  }
}

// ---------------------------------------------------------------------------
// GCS upload
// ---------------------------------------------------------------------------

async function uploadSourceToGCS(
  token: string,
  bucketName: string,
  zipBuffer: Uint8Array,
): Promise<{ bucket: string; object: string }> {
  const objectName = `cloud-function-source/openloom-${Date.now()}.zip`
  const gcsUrl = `https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(bucketName)}/o?uploadType=media&name=${encodeURIComponent(objectName)}`
  log(`Uploading source to GCS: gs://${bucketName}/${objectName} (${zipBuffer.length} bytes)`)

  const res = await fetch(gcsUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/zip',
    },
    body: zipBuffer as BodyInit,
  })

  if (!res.ok) {
    const body = await res.text()
    log(`GCS upload failed: ${res.status}`, body)
    throw new Error(`Failed to upload source to GCS: ${res.statusText}`)
  }

  log(`Source uploaded to gs://${bucketName}/${objectName}`)
  return { bucket: bucketName, object: objectName }
}

// ---------------------------------------------------------------------------
// Function state check and management
// ---------------------------------------------------------------------------

type FunctionState = 'none' | 'v1' | 'v2'

async function checkFunctionState(
  token: string,
  functionName: string,
): Promise<FunctionState> {
  const v2Url = `https://cloudfunctions.googleapis.com/v2/${functionName}`
  log(`Checking if v2 function exists: ${v2Url}`)
  const v2Res = await fetch(v2Url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (v2Res.ok) {
    const fn = (await v2Res.json()) as { environment?: string }
    log(`Function found via v2 API, environment: ${fn.environment}`)
    if (fn.environment === 'GEN_1') {
      return 'v1'
    }
    return 'v2'
  }

  const v1Url = `https://cloudfunctions.googleapis.com/v1/${functionName}`
  log(`Checking if v1 function exists: ${v1Url}`)
  const v1Res = await fetch(v1Url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (v1Res.ok) {
    log('Function exists as v1 (1st gen)')
    return 'v1'
  }

  log('Function does not exist')
  return 'none'
}

async function deleteV1Function(
  token: string,
  functionName: string,
): Promise<void> {
  const url = `https://cloudfunctions.googleapis.com/v1/${functionName}`
  log(`Deleting v1 function: ${url}`)
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const body = await res.text()
    log(`Delete v1 function failed: ${res.status}`, body)
    throw new Error(`Failed to delete existing v1 function: ${res.status}`)
  }
  const op = (await res.json()) as { name: string }
  log(`Delete operation started: ${op.name}`)

  const start = Date.now()
  while (Date.now() - start < 120_000) {
    await new Promise((r) => setTimeout(r, 5_000))
    const pollRes = await fetch(
      `https://cloudfunctions.googleapis.com/v1/${op.name}`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (pollRes.ok) {
      const pollOp = (await pollRes.json()) as { done?: boolean; error?: { message?: string } }
      if (pollOp.error) {
        throw new Error(`Delete v1 function failed: ${pollOp.error.message}`)
      }
      if (pollOp.done) {
        log('V1 function deleted successfully')
        return
      }
    }
  }
  throw new Error('Timed out waiting for v1 function deletion')
}

// ---------------------------------------------------------------------------
// Create / update function (Cloud Functions v2)
// ---------------------------------------------------------------------------

async function createOrUpdateFunction(
  token: string,
  projectId: string,
  source: { bucket: string; object: string },
  firestoreDbId: string | undefined,
): Promise<string> {
  const parent = `projects/${projectId}/locations/us-central1`
  const functionName = `${parent}/functions/openloom`
  const state = await checkFunctionState(token, functionName)

  if (state === 'v1') {
    log('Existing v1 function detected -- deleting before creating v2...')
    await deleteV1Function(token, functionName)
  }

  const body = {
    name: functionName,
    buildConfig: {
      runtime: 'nodejs20',
      entryPoint: 'openloom',
      source: {
        storageSource: {
          bucket: source.bucket,
          object: source.object,
        },
      },
    },
    serviceConfig: {
      availableMemory: '256Mi',
      timeoutSeconds: 60,
      environmentVariables: {
        FIRESTORE_DB_ID: firestoreDbId || '(default)',
      },
      ingressSettings: 'ALLOW_ALL',
      allTrafficOnLatestRevision: true,
    },
  }

  let url: string
  let method: string

  if (state === 'v2') {
    url = `https://cloudfunctions.googleapis.com/v2/${functionName}?updateMask=buildConfig,serviceConfig`
    method = 'PATCH'
    log(`Updating existing v2 function: ${method} ${url}`)
  } else {
    url = `https://cloudfunctions.googleapis.com/v2/${parent}/functions?functionId=openloom`
    method = 'POST'
    log(`Creating new v2 function: ${method} ${url}`)
  }
  log('Function payload:', body)

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errText = await res.text()
    log(`Create/update function failed: ${res.status}`, errText)
    let errBody: { error?: { code?: number; message?: string; status?: string } } = {}
    try { errBody = JSON.parse(errText) } catch { /* */ }

    // Function already exists on create -- fall back to update
    if (state !== 'v2' && errBody.error?.code === 409) {
      log('Function already exists (409), falling back to PATCH')
      const patchUrl = `https://cloudfunctions.googleapis.com/v2/${functionName}?updateMask=buildConfig,serviceConfig`
      const patchRes = await fetch(patchUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      if (!patchRes.ok) {
        const patchText = await patchRes.text()
        log(`Fallback PATCH failed: ${patchRes.status}`, patchText)
        let patchErr: { error?: { message?: string } } = {}
        try { patchErr = JSON.parse(patchText) } catch { /* */ }
        throw new Error(patchErr.error?.message || patchRes.statusText)
      }
      const op = (await patchRes.json()) as { name: string }
      log(`Fallback PATCH succeeded, operation: ${op.name}`)
      return op.name
    }

    const errMsg = errBody.error?.message || ''

    // Detect actAs permission error
    if (errMsg.includes('iam.serviceaccounts.actAs')) {
      const targetMatch = errMsg.match(/serviceAccounts\/([\w.@-]+)/)
      const targetSa = targetMatch?.[1] || 'the default compute service account'
      throw new DeployActionError(
        `Grant the "Service Account User" role to your service account on ${targetSa}, then retry.`,
        [
          {
            label: 'Open IAM Settings',
            url: `https://console.cloud.google.com/iam-admin/iam?project=${projectId}`,
          },
        ],
      )
    }

    // Check for API not enabled errors
    if (
      errMsg.includes('has not been used') ||
      errMsg.includes('is disabled')
    ) {
      const disabled = await checkDisabledApis(token, projectId)
      throw disabled.length > 0
        ? apiNotEnabledErrorFromActions(disabled)
        : apiNotEnabledErrorAll(projectId)
    }

    throw new Error(errBody.error?.message || res.statusText)
  }

  const operation = (await res.json()) as { name: string }
  log(`Function ${state === 'v2' ? 'update' : 'create'} succeeded, operation: ${operation.name}`)
  return operation.name
}

// ---------------------------------------------------------------------------
// Poll operation
// ---------------------------------------------------------------------------

async function pollOperation(
  token: string,
  operationName: string,
  timeoutMs = 600_000,
): Promise<string | undefined> {
  const start = Date.now()
  const interval = 5_000
  let pollCount = 0

  log(`Polling operation (v2): ${operationName} (timeout: ${timeoutMs}ms)`)

  while (Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, interval))
    pollCount++

    const res = await fetch(
      `https://cloudfunctions.googleapis.com/v2/${operationName}`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (res.ok) {
      const op = (await res.json()) as {
        done?: boolean
        error?: { message?: string; code?: number }
        metadata?: unknown
        response?: { url?: string; serviceConfig?: { uri?: string } }
      }
      log(`Poll #${pollCount}: done=${op.done}`, op.error || op.metadata || '')
      if (op.error) {
        throw new Error(`Deployment failed: ${op.error.message}`)
      }
      if (op.done) {
        log(`Operation completed after ${pollCount} polls (${Math.round((Date.now() - start) / 1000)}s)`)
        const functionUrl = op.response?.url || op.response?.serviceConfig?.uri
        if (functionUrl) {
          log(`Function URL: ${functionUrl}`)
        }
        return functionUrl
      }
    } else {
      log(`Poll #${pollCount}: HTTP ${res.status}`)
    }
  }

  throw new Error('Deployment timed out -- the function may still be deploying in the GCP console. Wait a minute, then try again.')
}

// ---------------------------------------------------------------------------
// Get function URL
// ---------------------------------------------------------------------------

async function getFunctionUrl(
  token: string,
  functionName: string,
): Promise<string | undefined> {
  const url = `https://cloudfunctions.googleapis.com/v2/${functionName}`
  log(`Fetching function details for URL: ${url}`)
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    log(`Failed to fetch function: ${res.status}`)
    return undefined
  }
  const fn = (await res.json()) as { url?: string; serviceConfig?: { uri?: string } }
  const fnUrl = fn.url || fn.serviceConfig?.uri
  log(`Function URL from GET: ${fnUrl}`)
  return fnUrl
}

// ---------------------------------------------------------------------------
// Set public access (Cloud Run IAM)
// ---------------------------------------------------------------------------

async function setPublicAccess(
  token: string,
  projectId: string,
  functionName: string,
): Promise<void> {
  const fnUrl = `https://cloudfunctions.googleapis.com/v2/${functionName}`
  log(`Fetching function details for Cloud Run service: ${fnUrl}`)
  const fnRes = await fetch(fnUrl, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!fnRes.ok) {
    throw new Error(`Failed to get function details: ${fnRes.status}`)
  }
  const fn = (await fnRes.json()) as {
    serviceConfig?: { service?: string; uri?: string }
  }

  let serviceName = fn.serviceConfig?.service
  log(`Cloud Run service from function: ${serviceName}`)

  if (!serviceName) {
    throw new Error('Could not determine Cloud Run service name from function')
  }

  if (!serviceName.startsWith('projects/')) {
    serviceName = `projects/${projectId}/locations/us-central1/services/${serviceName}`
    log(`Expanded service name: ${serviceName}`)
  }

  const iamUrl = `https://run.googleapis.com/v2/${serviceName}:setIamPolicy`
  log(`Setting public access on Cloud Run service: ${iamUrl}`)
  const iamRes = await fetch(iamUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      policy: {
        bindings: [
          {
            role: 'roles/run.invoker',
            members: ['allUsers'],
          },
        ],
      },
    }),
  })

  if (!iamRes.ok) {
    const body = await iamRes.text()
    log(`setIamPolicy on Cloud Run failed: ${iamRes.status}`, body)

    if (iamRes.status === 403) {
      throw new DeployActionError(
        `The service account lacks permission to make the function publicly accessible. ` +
        `Grant the "Cloud Run Admin" role to the service account, then retry.`,
        [
          {
            label: 'Open IAM Settings',
            url: `https://console.cloud.google.com/iam-admin/iam?project=${projectId}`,
          },
        ],
      )
    }

    throw new Error(`Failed to set public access: ${body}`)
  }

  log('Public access set successfully -- allUsers can invoke the function')
}

// ---------------------------------------------------------------------------
// Main deployment function
// ---------------------------------------------------------------------------

export async function deployFirebase(
  settings: AppSettings,
  onProgress: StepUpdateCallback,
): Promise<boolean> {
  const serviceAccountJson = settings.serviceAccountJson
  const projectId = settings.firebaseProjectId
  const firestoreDbId = settings.firestoreDbId
  const storageBucket = settings.resolvedBucket

  if (!serviceAccountJson || !projectId || !storageBucket) {
    const steps: ProvisioningStep[] = [
      {
        id: 'validate',
        label: 'Validating settings...',
        status: 'error',
        error: 'Missing required Firebase settings (service account, project ID, or storage bucket).',
      },
    ]
    onProgress(steps)
    return false
  }

  const sa = JSON.parse(serviceAccountJson)
  const saEmail = sa.client_email || 'unknown'

  const steps: ProvisioningStep[] = [
    { id: 'enable-apis', label: 'Enabling required APIs...', status: 'pending' },
    { id: 'check-access', label: 'Checking Cloud Functions access...', status: 'pending' },
    { id: 'upload-source', label: 'Building & uploading function source...', status: 'pending' },
    { id: 'create-function', label: 'Creating/updating Cloud Function...', status: 'pending' },
    { id: 'set-public-access', label: 'Setting public access...', status: 'pending' },
  ]

  function updateStep(id: string, update: Partial<ProvisioningStep>) {
    const step = steps.find((s) => s.id === id)
    if (step) Object.assign(step, update)
    onProgress([...steps])
  }

  log('=== Starting Cloud Function deployment (v2 / 2nd gen) ===')
  log(`Project: ${projectId}, SA: ${saEmail}, Bucket: ${storageBucket}, Firestore DB: ${firestoreDbId || '(default)'}`)

  try {
    const token = await getAccessToken(serviceAccountJson)

    // Step 1: Enable APIs (best-effort)
    updateStep('enable-apis', { status: 'running' })
    log('Step 1/5: Attempting to enable APIs (best-effort)...')
    await tryEnableApis(token, projectId)
    updateStep('enable-apis', { status: 'done' })
    log('Step 1/5: Done')

    // Step 2: Check access
    updateStep('check-access', { status: 'running' })
    log('Step 2/5: Checking Cloud Functions v2 access...')
    await checkCloudFunctionsAccess(token, projectId, saEmail)
    updateStep('check-access', { status: 'done' })
    log('Step 2/5: Cloud Functions v2 access confirmed')

    // Step 3: Build ZIP and upload
    updateStep('upload-source', { status: 'running' })
    log('Step 3/5: Building ZIP and uploading source to GCS...')
    const encoder = new TextEncoder()
    const zipBuffer = createZipBuffer([
      { name: 'index.js', content: encoder.encode(FUNCTION_INDEX_JS) },
      { name: 'package.json', content: encoder.encode(FUNCTION_PACKAGE_JSON) },
    ])
    log(`ZIP built (${zipBuffer.length} bytes)`)

    const source = await uploadSourceToGCS(token, storageBucket, zipBuffer)
    updateStep('upload-source', { status: 'done' })
    log('Step 3/5: Source uploaded to GCS')

    // Step 4: Create or update function with retry
    updateStep('create-function', { status: 'running' })
    log('Step 4/5: Creating/updating function (v2)...')
    let operationName: string | undefined
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        operationName = await createOrUpdateFunction(
          token,
          projectId,
          source,
          firestoreDbId,
        )
        break
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes('unable to queue') && attempt < 5) {
          log(`Step 4/5: Attempt ${attempt} failed (operation in progress), retrying in 15s...`)
          await new Promise((r) => setTimeout(r, 15_000))
        } else {
          throw e
        }
      }
    }
    if (!operationName) throw new Error('Failed to create/update function after retries')

    // Poll until complete
    updateStep('create-function', { status: 'waiting', label: 'Waiting for deployment to complete...' })
    log('Step 4/5: Waiting for deployment to complete...')
    let functionUrl = await pollOperation(token, operationName)
    updateStep('create-function', { status: 'done', label: 'Creating/updating Cloud Function...' })
    log('Step 4/5: Deployment complete')

    // Get function URL if not in operation response
    const functionName = `projects/${projectId}/locations/us-central1/functions/openloom`
    if (!functionUrl) {
      functionUrl = await getFunctionUrl(token, functionName)
    }

    // Step 5: Set public access with retry
    updateStep('set-public-access', { status: 'running' })
    log('Step 5/5: Setting public access on Cloud Run service...')
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        await setPublicAccess(token, projectId, functionName)
        break
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes('unable to queue') && attempt < 5) {
          log(`Step 5/5: Attempt ${attempt} failed (service not ready), retrying in 15s...`)
          await new Promise((r) => setTimeout(r, 15_000))
        } else {
          throw e
        }
      }
    }
    updateStep('set-public-access', { status: 'done' })
    log('Step 5/5: Public access configured')

    log('=== Cloud Function deployment finished (v2) ===')
    if (functionUrl) log(`Function URL: ${functionUrl}`)

    return true
  } catch (e) {
    if (e instanceof DeployActionError) {
      log(`=== Cloud Function deployment BLOCKED: ${e.message} ===`)
      // Find the first running/pending step and mark it as error with actions
      const activeStep = steps.find((s) => s.status === 'running' || s.status === 'waiting')
      if (activeStep) {
        updateStep(activeStep.id, {
          status: 'error',
          error: e.message,
          actions: e.enableUrls,
        })
      }
      return false
    }
    const errMsg = e instanceof Error ? e.message : String(e)
    log(`=== Cloud Function deployment FAILED: ${errMsg} ===`)
    const activeStep = steps.find((s) => s.status === 'running' || s.status === 'waiting')
    if (activeStep) {
      updateStep(activeStep.id, { status: 'error', error: errMsg })
    }
    return false
  }
}
