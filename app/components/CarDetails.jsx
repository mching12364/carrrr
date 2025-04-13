import React from 'react';

export default function CarDetails({ carData }) {
  const { make, model, year, specifications } = carData;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold gradient-text">
          {make} {model}
        </h2>
        {year && <p className="text-xl text-slate-600">{year}</p>}
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Specifications</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {specifications.map((spec, index) => (
            <div key={index} className="bg-slate-50 p-3 rounded-lg">
              <p className="text-sm text-slate-500">{spec.name}</p>
              <p className="font-medium">{spec.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200">
        <p className="text-sm text-slate-500">
          * Specifications are AI-generated and may not be 100% accurate
        </p>
      </div>
    </div>
  );
}