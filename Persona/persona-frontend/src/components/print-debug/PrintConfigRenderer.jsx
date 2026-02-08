"use client"

export default function PrintConfigRenderer({ config }) {
  if (!config) return null

  switch (config.type) {
    case "tshirt":
      return <TshirtLayout config={config} />

    case "mug":
      return <MugLayout config={config} />

    case "mobileCase":
      return <MobileCaseLayout config={config} />

    case "general":
      return <GeneralLayout config={config} />

    default:
      return <UnknownLayout config={config} />
  }
}

/* =======================
   T-SHIRT
======================= */
function TshirtLayout({ config }) {
  return (
    <section>
      <h2 className="font-semibold">T-Shirt Print Areas</h2>

      {Object.entries(config.views || {}).map(([viewKey, view]) => (
        <div key={viewKey} className="border p-3 mb-4">
          <p className="font-medium">View: {viewKey}</p>
          <p>Base Image:</p>
          <pre>{view.baseImage || "none"}</pre>

          {view.areas?.map(area => (
            <AreaBlock key={area.id} area={area} />
          ))}
        </div>
      ))}
    </section>
  )
}

/* =======================
   MUG
======================= */
function MugLayout({ config }) {
  return (
    <section>
      <h2 className="font-semibold">Mug Print Areas</h2>

      {Object.entries(config.views || {}).map(([viewKey, view]) => (
        <div key={viewKey} className="border p-3 mb-4">
          <p className="font-medium">View: {viewKey}</p>
          <p>Base Image:</p>
          <pre>{view.baseImage || "none"}</pre>

          {view.areas?.map(area => (
            <AreaBlock key={area.id} area={area} />
          ))}
        </div>
      ))}
    </section>
  )
}

/* =======================
   MOBILE CASE (MODEL BASED)
======================= */
function MobileCaseLayout({ config }) {
  return (
    <section>
      <h2 className="font-semibold">Mobile Case Models</h2>

      {config.models?.map(model => (
        <div key={model.modelCode} className="border p-3 mb-4">
          <p className="font-medium">
            {model.modelName} ({model.modelCode})
          </p>

          <p>Base Image:</p>
          <pre>{model.view?.baseImage || "none"}</pre>

          {model.view?.areas?.map(area => (
            <AreaBlock key={area.id} area={area} />
          ))}
        </div>
      ))}
    </section>
  )
}

/* =======================
   GENERAL PRINT
======================= */
function GeneralLayout({ config }) {
  return (
    <section>
      <h2 className="font-semibold">General Print Area</h2>
      <AreaBlock area={config.area} />
    </section>
  )
}

/* =======================
   FALLBACK
======================= */
function UnknownLayout({ config }) {
  return (
    <section>
      <h2 className="font-semibold text-red-600">Unknown Print Config</h2>
      <pre>{JSON.stringify(config, null, 2)}</pre>
    </section>
  )
}

/* =======================
   SHARED AREA BLOCK
======================= */
function AreaBlock({ area }) {
  if (!area) return null

  return (
    <div className="ml-4 mt-3 border-l pl-3">
      <p><b>ID:</b> {area.id}</p>
      <p><b>Name:</b> {area.name}</p>
      <p><b>Max:</b> {area.max}</p>

      {area.type && <p><b>Type:</b> {area.type}</p>}
      {area.description && <p><b>Description:</b> {area.description}</p>}

      <p className="mt-1"><b>References:</b></p>
      <pre>{JSON.stringify(area.references || [], null, 2)}</pre>
    </div>
  )
}
