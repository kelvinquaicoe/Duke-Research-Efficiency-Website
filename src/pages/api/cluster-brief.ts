export const prerender = false;

export async function GET() {
  const token = import.meta.env.LITELLM_TOKEN;

  if (!token) {
    return new Response(JSON.stringify({ error: "Missing LITELLM_TOKEN" }), {
      status: 500,
    });
  }

  return new Response(
    JSON.stringify({
      brief:
        "Slurm is cruising at 74% utilization. GPU pressure is moderate and queue depth is rising.",
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}