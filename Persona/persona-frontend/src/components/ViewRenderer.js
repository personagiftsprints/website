import PreviewCard from "./PreviewCard"

export default function ViewRenderer({ views }) {
  return Object.entries(views).map(([key, view]) => (
    <PreviewCard
      key={key}
      title={`${key.charAt(0).toUpperCase() + key.slice(1)} View`}
      baseImage={view.baseImage}
      areas={view.areas}
    />
  ))
}