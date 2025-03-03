import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { FaTimes } from "react-icons/fa";

const productSchema = yup
  .object({
    nombre: yup.string().required("El nombre del producto es requerido"),
    descripcion: yup.string().required("La descripción es requerida"),
    stock: yup.number().min(0).required("El stock es requerido"),
    color: yup.string().required("El color es requerido"),
    precio: yup.number().min(0).required("El precio es requerido"),
  })
  .required();

function ProductForm({
  onSubmit,
  onCancel,
  editProducto,
  loading,
  error,
  imagePreview,
  setImagePreview,
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(productSchema),
    defaultValues: editProducto || {},
  });

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="bg-secondary rounded-lg p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-foreground">
          {editProducto ? "Editar producto" : "Añadir producto"}
        </h2>
      </div>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
            <span className="w-5 h-5 bg-muted rounded-full flex items-center justify-center text-muted/60">
              1
            </span>
            Información
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-muted block mb-1 text-sm">Título *</label>
              <input
                type="text"
                {...register("nombre")}
                placeholder="250 caracteres max"
                className="w-full rounded-lg border border-border bg-input p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.nombre && (
                <p className="text-error text-sm mt-1">
                  {errors.nombre.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-muted block mb-1 text-sm">
                Descripción *
              </label>
              <textarea
                {...register("descripcion")}
                placeholder="The clearer and shorter the better"
                className="w-full rounded-lg border border-border bg-input p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary h-24 resize-none"
              />
              {errors.descripcion && (
                <p className="text-error text-sm mt-1">
                  {errors.descripcion.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-muted block mb-1 text-sm">Imagen</label>
              <div className="rounded-lg border border-border bg-input p-3 flex items-center gap-2 text-muted">
                <span>Sube una imagen para ilustrar tu producto.</span>
                <input
                  id="imagen"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById("imagen").click()}
                  className="ml-auto bg-primary text-white px-3 py-1 rounded-full hover:bg-opacity-90 transition-colors duration-200"
                >
                  Browse
                </button>
              </div>
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Previsualización"
                  className="mt-2 rounded-lg max-w-xs"
                />
              )}
            </div>
          </form>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
            <span className="w-5 h-5 bg-muted rounded-full flex items-center justify-center text-muted/60">
              2
            </span>
            Configuración
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-muted block mb-1 text-sm">Stock *</label>
              <input
                type="number"
                {...register("stock")}
                className="w-full rounded-lg border border-border bg-input p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.stock && (
                <p className="text-error text-sm mt-1">
                  {errors.stock.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-muted block mb-1 text-sm">Color *</label>
              <input
                type="text"
                {...register("color")}
                className="w-full rounded-lg border border-border bg-input p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.color && (
                <p className="text-error text-sm mt-1">
                  {errors.color.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-muted block mb-1 text-sm">Precio *</label>
              <input
                type="number"
                {...register("precio")}
                className="w-full rounded-lg border border-border bg-input p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.precio && (
                <p className="text-error text-sm mt-1">
                  {errors.precio.message}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border text-muted/80 p-3 hover:bg-muted/5"
          >
            Guardar borrador
          </button>
          <button
            type="submit"
            onClick={handleSubmit(onSubmit)}
            className="rounded-lg bg-primary border border-blue-400 text-white p-3 hover:bg-opacity-90"
          >
            Publicar
          </button>
        </div>
      </div>
      {error && <p className="text-error text-sm mt-2">{error}</p>}
      {loading && <p className="text-muted text-sm mt-2">Cargando...</p>}
    </div>
  );
}

export default ProductForm;
