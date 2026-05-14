export async function readApiJson<T>(res: Response) {
  const contentType = res.headers.get("content-type") ?? "";

  if (res.redirected && res.url.includes("/login")) {
    redirectToLogin();
    throw new Error("Session expired. Redirecting to login.");
  }

  if (!contentType.includes("application/json")) {
    const responseText = await res.text();

    if (
      responseText.includes("<!DOCTYPE html") ||
      responseText.includes("<html")
    ) {
      redirectToLogin();
      throw new Error("Session expired. Redirecting to login.");
    }

    throw new Error("Unexpected response from server.");
  }

  return (await res.json()) as T;
}

function redirectToLogin() {
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}
