import { http, HttpResponse, delay } from "msw";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const handlers = [
  http.post(`${API_URL}/deployments`, async () => {
    await delay(1000);

    // Simulate 10% error rate for testing error UI
    if (Math.random() < 0.1) {
      return HttpResponse.json(
        {
          error: {
            code: "INTERNAL_ERROR",
            message: "Something went wrong on the server. Please try again.",
          },
          requestId: `req_${crypto.randomUUID().slice(0, 8)}`,
        },
        { status: 500 },
      );
    }

    const submissionId = `SUB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    return HttpResponse.json({ submissionId }, { status: 201 });
  }),

  http.get(`${API_URL}/deployments/:submissionId`, ({ params }) => {
    return HttpResponse.json({
      submissionId: params.submissionId,
      status: "accepted",
      createdAt: new Date().toISOString(),
    });
  }),

  http.get(`${API_URL}/healthz`, () => {
    return HttpResponse.json({ status: "ok" });
  }),
];
