import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";

admin.initializeApp();
const db = admin.firestore();

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(res: import("firebase-functions/v2/https").Response, data: unknown, status = 200) {
  Object.entries(corsHeaders).forEach(([k, v]) => res.set(k, v));
  res.status(status).json(data);
}

export const thari = onRequest(async (req, res) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    Object.entries(corsHeaders).forEach(([k, v]) => res.set(k, v));
    res.status(204).send("");
    return;
  }

  // Strip the Cloud Functions function-name prefix from the path.
  // In production the URL is /<project>/<region>/thari/v/{code}/...
  // req.path already strips /<project>/<region> but still includes /thari.
  const path = req.path.replace(/^\/thari/, "");

  // GET /v/:code — video metadata
  const videoMatch = path.match(/^\/v\/([\w-]+)$/);
  if (videoMatch && req.method === "GET") {
    const code = videoMatch[1];
    const doc = await db.collection("videos").doc(code).get();
    if (!doc.exists) {
      json(res, { error: "Video not found" }, 404);
      return;
    }
    json(res, doc.data());
    return;
  }

  // POST /v/:code/view — increment view count (atomic)
  const viewMatch = path.match(/^\/v\/([\w-]+)\/view$/);
  if (viewMatch && req.method === "POST") {
    const code = viewMatch[1];
    const ref = db.collection("videos").doc(code);
    const doc = await ref.get();
    if (!doc.exists) {
      json(res, { error: "Video not found" }, 404);
      return;
    }
    await ref.update({ view_count: admin.firestore.FieldValue.increment(1) });
    json(res, { ok: true });
    return;
  }

  // GET /v/:code/reactions — list reactions
  const reactionsMatch = path.match(/^\/v\/([\w-]+)\/reactions$/);
  if (reactionsMatch && req.method === "GET") {
    const code = reactionsMatch[1];
    const snapshot = await db
      .collection("videos")
      .doc(code)
      .collection("reactions")
      .orderBy("created_at", "asc")
      .get();
    const reactions = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    json(res, reactions);
    return;
  }

  // POST /v/:code/reactions — add reaction
  if (reactionsMatch && req.method === "POST") {
    const code = reactionsMatch[1];
    const { emoji, timestamp } = req.body;
    if (!emoji || typeof timestamp !== "number") {
      json(res, { error: "emoji and timestamp are required" }, 400);
      return;
    }
    const docRef = await db
      .collection("videos")
      .doc(code)
      .collection("reactions")
      .add({
        emoji,
        timestamp,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    const created = await docRef.get();
    json(res, { id: docRef.id, ...created.data() }, 201);
    return;
  }

  json(res, { error: "Not found" }, 404);
});
