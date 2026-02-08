import PrintConfigRenderer from '@/components/print-debug/PrintConfigRenderer'


function TshirtLayout({ config }) {
  return (
    <section>
      <h2 className="font-semibold">T-Shirt Print Areas</h2>

      {Object.entries(config.views || {}).map(([viewKey, view]) => (
        <div key={viewKey} className="border p-3 mb-4">
          <h3>View: {viewKey}</h3>
          <pre>Base Image: {view.baseImage}</pre>

          {view.areas.map(area => (
            <AreaBlock key={area.id} area={area} />
          ))}
        </div>
      ))}
    </section>
  )
}

function MugLayout({ config }) {
  return (
    <section>
      <h2 className="font-semibold">Mug Print Areas</h2>

      {Object.entries(config.views || {}).map(([viewKey, view]) => (
        <div key={viewKey} className="border p-3 mb-4">
          <h3>View: {viewKey}</h3>
          <pre>Base Image: {view.baseImage}</pre>

          {view.areas.map(area => (
            <AreaBlock key={area.id} area={area} />
          ))}
        </div>
      ))}
    </section>
  )
}


function MobileCaseLayout({ config }) {
  return (
    <section>
      <h2 className="font-semibold">Mobile Case Models</h2>

      {config.models.map(model => (
        <div key={model.modelCode} className="border p-3 mb-4">
          <h3>
            {model.modelName} ({model.modelCode})
          </h3>

          <pre>Base Image: {model.view.baseImage}</pre>

          {model.view.areas.map(area => (
            <AreaBlock key={area.id} area={area} />
          ))}
        </div>
      ))}
    </section>
  )
}


function GeneralLayout({ config }) {
  return (
    <section>
      <h2 className="font-semibold">General Print Area</h2>
      <AreaBlock area={config.area} />
    </section>
  )
}


function UnknownLayout({ config }) {
  return (
    <pre>{JSON.stringify(config, null, 2)}</pre>
  )
}


function AreaBlock({ area }) {
  return (
    <div className="ml-4 mt-3 border-l pl-3">
      <p><b>ID:</b> {area.id}</p>
      <p><b>Name:</b> {area.name}</p>
      <p><b>Max:</b> {area.max}</p>

      {area.type && <p><b>Type:</b> {area.type}</p>}
      {area.description && <p><b>Description:</b> {area.description}</p>}

      <p><b>References:</b></p>
      <pre>{JSON.stringify(area.references || [], null, 2)}</pre>
    </div>
  )
}




return (
  <div className="p-6 space-y-6 text-sm">
    <h1 className="text-xl font-bold">Customization Debug View</h1>

    <pre>{JSON.stringify({
      product: {
        id: product._id,
        name: product.name,
        type: product.type
      },
      printConfigType: config?.type
    }, null, 2)}</pre>

    <PrintConfigRenderer config={config} />
  </div>
)
