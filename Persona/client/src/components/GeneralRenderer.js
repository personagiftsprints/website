import PreviewCard from "./PreviewCard"
import { Layers } from "lucide-react"

export default function GeneralRenderer({ area }) {
  return (
    <PreviewCard
      title="Default Print Area"
      baseImage={null}
      areas={[
        {
          id: area.id,
          name: area.name,
          max: area.max,
          references: area.referenceImages || []
        }
      ]}
      subtitle={area.description}
    />
  )
}