import { useMemo, useState, type ChangeEvent } from "react";

type FoodItem = {
  name: string;
  estimated_weight_grams: number;
  calories: number;
};

type AnalyzeResponse = {
  total_calories: number;
  foods: FoodItem[];
};

function isAnalyzeResponse(payload: unknown): payload is AnalyzeResponse {
  if (!payload || typeof payload !== "object") return false;
  const obj = payload as Record<string, unknown>;
  return typeof obj.total_calories === "number" && Array.isArray(obj.foods);
}

function getApiErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const obj = payload as Record<string, unknown>;
  if (typeof obj.message === "string") return obj.message;
  if (typeof obj.error === "string") return obj.error;
  if (typeof obj.detail === "string") return obj.detail;
  return null;
}

export default function FoodAnalyzer() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImage(file);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError("");
  };

  const handleUpload = async () => {
    if (!image) return;

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("image", image);

      const res = await fetch("https://food-analyzer-qxr5.onrender.com/analyze-food", {
        method: "POST",
        body: formData,
      });

      let payload: unknown = null;
      try {
        payload = await res.json();
      } catch {
        payload = null;
      }

      if (!res.ok) {
        const apiMessage = getApiErrorMessage(payload);

        if (res.status === 402) {
          throw new Error(
            apiMessage ??
              "Payment required (402): backend billing or credits issue.",
          );
        }

        throw new Error(apiMessage ?? `Request failed with status ${res.status}.`);
      }

      if (!isAnalyzeResponse(payload)) {
        throw new Error("API returned unexpected response format.");
      }

      setResult(payload);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to analyze food image.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const foodCount = result?.foods.length ?? 0;
  const averageCalories = useMemo(() => {
    if (!result || result.foods.length === 0) return 0;
    return Math.round(result.total_calories / result.foods.length);
  }, [result]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-8 font-body text-slate-100 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(43,180,142,0.25),transparent_35%),radial-gradient(circle_at_80%_5%,rgba(134,226,196,0.2),transparent_30%),radial-gradient(circle_at_50%_90%,rgba(30,118,99,0.25),transparent_40%)]" />

      <div className="relative mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-calvic-500/30 bg-slate-900/70 p-6 shadow-glow backdrop-blur xl:p-8">
          <p className="mb-2 inline-flex rounded-full border border-calvic-300/60 bg-calvic-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-calvic-100">
            Nutrition Suite
          </p>
          <h1 className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
            Food Vision Dashboard
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-300 sm:text-base">
            Upload a meal image and get AI-powered calorie estimation with a clear
            per-item breakdown.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <StatCard label="Items Detected" value={foodCount.toString()} />
            <StatCard
              label="Total Calories"
              value={result ? `${result.total_calories} kcal` : "--"}
            />
            <StatCard
              label="Avg Calories / Item"
              value={result ? `${averageCalories} kcal` : "--"}
            />
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="h-full rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl backdrop-blur xl:p-6">
              <h2 className="font-display text-xl font-semibold text-white">
                Upload Meal Photo
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Use a clear top-down image for best detection quality.
              </p>

              <label className="mt-5 block cursor-pointer rounded-2xl border border-dashed border-calvic-300/45 bg-slate-800/70 p-6 text-center transition hover:border-calvic-300 hover:bg-slate-800">
                <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-calvic-500/20 text-2xl text-calvic-100">
                  +
                </span>
                <span className="block text-sm font-semibold text-slate-100">
                  Click to choose image
                </span>
                <span className="mt-1 block text-xs text-slate-400">
                  JPG, PNG, WEBP supported
                </span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageChange}
                  className="sr-only"
                />
              </label>

              <button
                onClick={handleUpload}
                disabled={loading || !image}
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-calvic-700 via-calvic-500 to-calvic-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-calvic-800/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Analyzing image..." : "Analyze with"}
              </button>

              {error && (
                <p className="mt-4 rounded-xl border border-rose-500/50 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
                  {error}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-6 lg:col-span-3">
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl backdrop-blur xl:p-6">
              <h2 className="font-display text-xl font-semibold text-white">
                Preview
              </h2>
              <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-slate-800">
                {preview ? (
                  <img
                    src={preview}
                    alt="Food preview"
                    className="h-64 w-full object-cover sm:h-80"
                  />
                ) : (
                  <div className="flex h-64 w-full items-center justify-center text-sm text-slate-400 sm:h-80">
                    No image selected yet
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl backdrop-blur xl:p-6">
              <h2 className="font-display text-xl font-semibold text-white">
                Nutrition Breakdown
              </h2>

              {!result && (
                <div className="mt-4 rounded-2xl border border-dashed border-white/20 bg-slate-800/60 px-4 py-6 text-sm text-slate-400">
                  Analysis results will appear here after upload.
                </div>
              )}

              {result && (
                <div className="mt-4 space-y-3">
                  {result.foods.map((food: FoodItem, index: number) => (
                    <article
                      key={`${food.name}-${index}`}
                      className="rounded-2xl border border-white/10 bg-slate-800/90 px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-white sm:text-base">
                          {food.name}
                        </h3>
                        <span className="rounded-full bg-calvic-500/20 px-2.5 py-1 text-xs font-medium text-calvic-100">
                          {food.calories} kcal
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                        Estimated weight: {food.estimated_weight_grams} g
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

type StatCardProps = {
  label: string;
  value: string;
};

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-800/80 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-bold text-white">{value}</p>
    </div>
  );
}
