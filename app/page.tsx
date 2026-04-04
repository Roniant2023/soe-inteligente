"use client";

import Image from "next/image";
import { useState } from "react";
import { initialSOEForm, type SOEForm } from "@/lib/types";
import {
  tiposObservacion,
  areasUnidad,
  operacionesTarea,
} from "@/lib/options";

type SOEAIAction =
  | "improve_description"
  | "suggest_immediate_action"
  | "suggest_recommendation";

export default function Page() {
  const [form, setForm] = useState<SOEForm>(initialSOEForm);
  const [loadingAction, setLoadingAction] = useState<SOEAIAction | null>(null);
  const [uiError, setUiError] = useState<string | null>(null);
  const [uiInfo, setUiInfo] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  async function runAI(action: SOEAIAction) {
    setUiError(null);
    setUiInfo(null);

    if (
      action === "improve_description" &&
      !form.descripcion_original.trim()
    ) {
      setUiError("Primero escribe la descripción original.");
      return;
    }

    if (
      action !== "improve_description" &&
      !form.descripcion_original.trim() &&
      !form.descripcion_mejorada.trim()
    ) {
      setUiError("Primero registra o mejora la descripción del hallazgo.");
      return;
    }

    setLoadingAction(action);

    try {
      const res = await fetch("/api/improve-soe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          descripcion_original: form.descripcion_original,
          descripcion_mejorada: form.descripcion_mejorada,
          tipo_observacion: form.tipo_observacion,
          area_unidad:
            form.area_unidad === "Otro" ? form.area_otro : form.area_unidad,
          operacion_tarea:
            form.operacion_tarea === "Otro"
              ? form.operacion_otro
              : form.operacion_tarea,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        setUiError(data?.error || "No se pudo procesar la solicitud.");
        return;
      }

      const result = String(data.result || "").trim();

      if (!result) {
        setUiError("La IA no devolvió contenido.");
        return;
      }

      if (action === "improve_description") {
        setForm((prev) => ({
          ...prev,
          descripcion_mejorada: result,
        }));
        setUiInfo("✅ Descripción mejorada correctamente.");
      }

      if (action === "suggest_immediate_action") {
        setForm((prev) => ({
          ...prev,
          accion_inmediata: result,
        }));
        setUiInfo("✅ Acción inmediata sugerida correctamente.");
      }

      if (action === "suggest_recommendation") {
        setForm((prev) => ({
          ...prev,
          recomendacion: result,
        }));
        setUiInfo("✅ Recomendación sugerida correctamente.");
      }
    } catch (error: any) {
      setUiError(error?.message || "Error inesperado.");
    } finally {
      setLoadingAction(null);
    }
  }

  function handleSave() {
    setUiInfo("Siguiente paso: conectar guardado en Supabase.");
    setUiError(null);
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">SOE Inteligente</h1>
          <div className="text-sm text-neutral-600">
            Sistema de Observación Estrella
          </div>
        </div>

        <Image
          src="/logo-eies.png"
          alt="Logo Estrella"
          width={220}
          height={80}
          className="h-20 w-auto object-contain"
          priority
        />
      </div>

      {(uiError || uiInfo) && (
        <div
          className={[
            "border rounded p-3 text-sm",
            uiError
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-green-50 border-green-200 text-green-800",
          ].join(" ")}
        >
          {uiError ?? uiInfo}
        </div>
      )}

      <section className="border rounded p-4 space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-xs text-neutral-600">Gestión de HSSEQ</div>
            <div className="text-lg font-semibold">
              Sistema de Observación Estrella
            </div>
            <div className="text-xs text-neutral-600">
              Formato: <b>02-01-112 F002</b> · Revisión: <b>01</b> · Emisión:{" "}
              <b>03/04/2026</b>
            </div>
          </div>
          <div className="text-xs text-neutral-600">
            Página: <b>1 de 1</b>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            placeholder="Fecha"
            type="date"
            name="fecha"
            value={form.fecha}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            placeholder="Cédula"
            name="cedula"
            value={form.cedula}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            placeholder="Cargo"
            name="cargo"
            value={form.cargo}
            onChange={handleChange}
            className="border p-2 rounded"
          />

          <input
            placeholder="Nombre"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            className="border p-2 rounded md:col-span-2"
          />
          <input
            placeholder="Empresa"
            name="empresa"
            value={form.empresa}
            onChange={handleChange}
            className="border p-2 rounded"
          />

          <input
            placeholder="Ubicación / Campo / Base"
            name="ubicacion"
            value={form.ubicacion}
            onChange={handleChange}
            className="border p-2 rounded md:col-span-2"
          />
          <input
            placeholder="Frente / Equipo / Unidad"
            name="frente_equipo"
            value={form.frente_equipo}
            onChange={handleChange}
            className="border p-2 rounded"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="border rounded p-3">
            <div className="font-medium">Tipo de observación</div>
            <div className="mt-2">
              <select
                name="tipo_observacion"
                value={form.tipo_observacion}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              >
                <option value="">Seleccione tipo</option>
                {tiposObservacion.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border rounded p-3">
            <div className="font-medium">¿Se detuvo la tarea?</div>
            <div className="mt-2 flex gap-4">
              {(["Si", "No"] as const).map((v) => (
                <label key={v} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="se_detuvo_tarea"
                    checked={form.se_detuvo_tarea === v}
                    onChange={() =>
                      setForm((prev) => ({ ...prev, se_detuvo_tarea: v }))
                    }
                  />
                  {v}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="border rounded p-3 space-y-2">
            <div className="font-medium">Área / Unidad</div>
            <select
              name="area_unidad"
              value={form.area_unidad}
              onChange={handleChange}
              className="border p-2 rounded w-full"
            >
              <option value="">Seleccione área</option>
              {areasUnidad.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>

            {form.area_unidad === "Otro" && (
              <input
                placeholder="Especifique otra área"
                name="area_otro"
                value={form.area_otro}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
            )}
          </div>

          <div className="border rounded p-3 space-y-2">
            <div className="font-medium">Operación / Tarea</div>
            <select
              name="operacion_tarea"
              value={form.operacion_tarea}
              onChange={handleChange}
              className="border p-2 rounded w-full"
            >
              <option value="">Seleccione operación</option>
              {operacionesTarea.map((operacion) => (
                <option key={operacion} value={operacion}>
                  {operacion}
                </option>
              ))}
            </select>

            {form.operacion_tarea === "Otro" && (
              <input
                placeholder="Especifique otra operación"
                name="operacion_otro"
                value={form.operacion_otro}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
            )}
          </div>
        </div>

        <div className="border rounded p-4 space-y-3">
          <div className="font-semibold">Descripción del hallazgo</div>

          <div className="space-y-2">
            <div className="text-sm text-neutral-600">Descripción original</div>
            <textarea
              name="descripcion_original"
              value={form.descripcion_original}
              onChange={handleChange}
              placeholder="Describe lo observado..."
              className="border p-2 rounded w-full min-h-[110px]"
            />
          </div>

          <button
            type="button"
            onClick={() => runAI("improve_description")}
            disabled={loadingAction === "improve_description"}
            className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loadingAction === "improve_description"
              ? "Procesando..."
              : "Mejorar descripción"}
          </button>

          <div className="space-y-2">
            <div className="text-sm text-neutral-600">Descripción mejorada</div>
            <textarea
              name="descripcion_mejorada"
              value={form.descripcion_mejorada}
              onChange={handleChange}
              placeholder="Texto mejorado por IA..."
              className="border p-2 rounded w-full min-h-[110px]"
            />
          </div>
        </div>

        <div className="border rounded p-4 space-y-3">
          <div className="font-semibold">Acción inmediata</div>
          <textarea
            name="accion_inmediata"
            value={form.accion_inmediata}
            onChange={handleChange}
            placeholder="Acción inmediata..."
            className="border p-2 rounded w-full min-h-[90px]"
          />
          <button
            type="button"
            onClick={() => runAI("suggest_immediate_action")}
            disabled={loadingAction === "suggest_immediate_action"}
            className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loadingAction === "suggest_immediate_action"
              ? "Procesando..."
              : "Sugerir acción inmediata"}
          </button>
        </div>

        <div className="border rounded p-4 space-y-3">
          <div className="font-semibold">Recomendación</div>
          <textarea
            name="recomendacion"
            value={form.recomendacion}
            onChange={handleChange}
            placeholder="Recomendación..."
            className="border p-2 rounded w-full min-h-[90px]"
          />
          <button
            type="button"
            onClick={() => runAI("suggest_recommendation")}
            disabled={loadingAction === "suggest_recommendation"}
            className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loadingAction === "suggest_recommendation"
              ? "Procesando..."
              : "Sugerir recomendación"}
          </button>
        </div>

        <div className="border rounded p-4 space-y-3">
          <div className="font-semibold">Control y seguimiento</div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              placeholder="Responsable"
              name="supervisor_control"
              value={form.supervisor_control}
              onChange={handleChange}
              className="border p-2 rounded md:col-span-3"
            />

            <select
              name="requiere_seguimiento"
              value={form.requiere_seguimiento}
              onChange={handleChange}
              className="border p-2 rounded"
            >
              <option value="">¿Requiere seguimiento?</option>
              <option value="Si">Sí</option>
              <option value="No">No</option>
            </select>

            <select
              name="requiere_ail"
              value={form.requiere_ail}
              onChange={handleChange}
              className="border p-2 rounded"
            >
              <option value="">¿Requiere AIL?</option>
              <option value="Si">Sí</option>
              <option value="No">No</option>
            </select>

            <select
              name="estado"
              value={form.estado}
              onChange={handleChange}
              className="border p-2 rounded"
            >
              <option value="Abierto">Abierto</option>
              <option value="Cerrado">Cerrado</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="w-full bg-black text-white py-3 rounded font-medium"
        >
          Guardar Observación
        </button>
      </section>
    </div>
  );
}