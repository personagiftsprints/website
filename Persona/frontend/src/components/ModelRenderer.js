import PreviewCard from "./PreviewCard"

export default function ModelRenderer({ models }) {
  return models.map(model => (
    <PreviewCard
      key={model.modelCode}
      title={model.modelName}
      baseImage={model.view.baseImage}
      areas={model.view.areas}
      subtitle={model.displaySize}
    />
  ))
}