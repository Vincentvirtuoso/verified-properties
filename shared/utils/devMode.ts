export function isDev() {
  return (
    typeof process !== "undefined" && process.env.NODE_ENV !== "production"
  );
}
export function isProduction() {
  return (
    typeof process !== "undefined" && process.env.NODE_ENV === "production"
  );
}
