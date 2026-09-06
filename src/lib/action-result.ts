export async function getActionData<T>(
  resultPromise: Promise<{ data?: T; error?: unknown }>,
): Promise<T> {
  const result = await resultPromise;

  if (result.error) {
    throw result.error;
  }

  if (result.data === undefined) {
    throw new Error("Action did not return data.");
  }

  return result.data;
}
