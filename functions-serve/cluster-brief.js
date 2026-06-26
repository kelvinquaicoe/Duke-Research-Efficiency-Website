/**
 * Netlify Function: cluster-brief.js
 * Lightweight status blurb for the chatbot UI.
 *
 * Deploy to: netlify/functions/cluster-brief.js
 * Accessible at: /.netlify/functions/cluster-brief
 */

export async function handler() {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    },
    body: JSON.stringify({
      brief: "Ask about jobs, GPUs, queue status, or anything else.",
      fetchedAt: new Date().toISOString(),
    }),
  };
}

