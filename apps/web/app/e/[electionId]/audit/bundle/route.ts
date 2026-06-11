import { getDemo } from "@/lib/demo";

// Serves the demo audit bundle for download/inspection. The CI/test export path
// (packages/audit writeBundleDir) writes the split files that `ecclesia-verify` consumes.
export async function GET() {
  const { bundle } = await getDemo();
  return new Response(JSON.stringify(bundle, null, 2), {
    headers: {
      "content-type": "application/json",
      "content-disposition": 'attachment; filename="ecclesia-audit-bundle.json"',
    },
  });
}
