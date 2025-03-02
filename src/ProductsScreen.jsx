import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import logo from "./assets/logo-white.png";

const productSchema = yup
  .object({
    nombre: yup.string().required("El nombre del producto es requerido"),
    descripcion: yup.string().required("La descripción es requerida"),
    stock: yup
      .number()
      .min(0, "El stock debe ser mayor o igual a 0")
      .required("El stock es requerido"),
    color: yup.string().required("El color es requerido"),
    precio: yup
      .number()
      .min(0, "El precio debe ser mayor o igual a 0")
      .required("El precio es requerido"),
  })
  .required();

function ProductsScreen({ user }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: yupResolver(productSchema),
  });
  const [productos, setProductos] = useState([]);
  const [editProducto, setEditProducto] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState(null); // Para previsualizar la imagen
  const [isModalOpen, setIsModalOpen] = useState(false); // Para controlar el modal

  const fetchProductos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("productos")
        .select("*")
        .eq("usuario_id", user.id);
      if (error) {
        setError("Error al cargar productos: " + error.message);
      } else {
        setProductos(data || []);
      }
    } catch (err) {
      setError("Error inesperado: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarProducto = async (data) => {
    setLoading(true);
    try {
      let imageUrl = null;
      if (data.imagen && data.imagen.length > 0) {
        const file = data.imagen[0];
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("productos") // Crea un bucket "productos" en Supabase Storage si no existe
          .upload(`public/${file.name}`, file);
        if (uploadError) throw uploadError;
        imageUrl = `https://tu-proyecto.supabase.co/storage/v1/object/public/productos/${file.name}`;
      }

      const { error } = await supabase.from("productos").insert({
        nombre: data.nombre,
        descripcion: data.descripcion,
        stock: data.stock,
        color: data.color,
        precio: data.precio,
        usuario_id: user.id,
        imagen_url: imageUrl, // Guarda la URL de la imagen en la base de datos
      });
      if (error) {
        setError("Error al agregar producto: " + error.message);
      } else {
        reset();
        setImagePreview(null);
        setIsModalOpen(false);
        await fetchProductos();
      }
    } catch (err) {
      setError("Error inesperado: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditarProducto = (producto) => {
    setEditProducto(producto);
    reset({
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      stock: producto.stock,
      color: producto.color,
      precio: producto.precio,
    });
    setImagePreview(producto.imagen_url || null); // Previsualización de la imagen existente
    setIsModalOpen(true);
  };

  const handleActualizarProducto = async (data) => {
    setLoading(true);
    try {
      let imageUrl = editProducto.imagen_url;
      if (data.imagen && data.imagen.length > 0) {
        const file = data.imagen[0];
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("productos")
          .upload(`public/${file.name}`, file);
        if (uploadError) throw uploadError;
        imageUrl = `https://tu-proyecto.supabase.co/storage/v1/object/public/productos/${file.name}`;
      }

      const { error } = await supabase
        .from("productos")
        .update({
          nombre: data.nombre,
          descripcion: data.descripcion,
          stock: data.stock,
          color: data.color,
          precio: data.precio,
          imagen_url: imageUrl,
        })
        .eq("id", editProducto.id);
      if (error) {
        setError("Error al actualizar producto: " + error.message);
      } else {
        setEditProducto(null);
        reset();
        setImagePreview(null);
        setIsModalOpen(false);
        await fetchProductos();
      }
    } catch (err) {
      setError("Error inesperado: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarProducto = async (id) => {
    setLoading(true);
    try {
      const { error } = await supabase.from("productos").delete().eq("id", id);
      if (error) {
        setError("Error al eliminar producto: " + error.message);
      } else {
        await fetchProductos();
      }
    } catch (err) {
      setError("Error inesperado: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, [user.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background max-w-6xl mx-auto flex items-center justify-center">
        Cargando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background max-w-6xl mx-auto font-sans p-6 ">
      {/* Barra superior */}
      <header className="flex justify-between items-center pb-6 border-b border-border">
        <img src={logo} alt="Logo" className="w-48" />
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-lg bg-primary border border-blue-400 text-white px-4 py-2 transition-colors duration-300 hover:bg-opacity-90"
        >
          Añadir producto
        </button>
      </header>

      {/* Lista de productos cargados por defecto */}
      {error && <p className="text-error text-sm mt-2">{error}</p>}

      <div className="mt-6">
        {productos.length === 0 ? (
          <p className="text-muted text-lg text-center">No hay productos.</p>
        ) : (
          <div className="space-y-4">
            {productos.map((producto) => (
              <div
                key={producto.id}
                className="bg-secondary rounded-lg shadow-md p-4 flex justify-between items-center transition-transform duration-300 ease-in-out hover:translate-y-[-2px] hover:shadow-lg"
              >
                <div>
                  <p className="text-lg text-foreground">{producto.nombre}</p>
                  <p className="text-muted">{producto.descripcion}</p>
                  <p className="text-muted">
                    Stock: {producto.stock}, Color: {producto.color}, Precio: $
                    {producto.precio}
                  </p>
                  {producto.imagen_url && (
                    <img
                      src={producto.imagen_url}
                      alt={producto.nombre}
                      className="mt-2 rounded-lg max-w-xs"
                    />
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditarProducto(producto)}
                    className="p-2 text-primary hover:text-opacity-80 transition-colors duration-300 hover:scale-110"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleEliminarProducto(producto.id)}
                    className="p-2 text-error hover:text-opacity-80 transition-colors duration-300 hover:scale-110"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para añadir/editar producto */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-secondary rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-foreground -tracking-[0.5px] mb-4">
              {editProducto ? "Editar producto" : "Añadir producto"}
            </h2>
            <form
              onSubmit={handleSubmit(
                editProducto ? handleActualizarProducto : handleAgregarProducto
              )}
              className="space-y-4"
            >
              {/* Apartado para subir imágenes */}
              <div>
                <label
                  htmlFor="imagen"
                  className="text-muted block mb-2 text-sm"
                >
                  Imagen
                </label>
                <input
                  id="imagen"
                  type="file"
                  accept="image/*"
                  {...register("imagen")}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const previewUrl = URL.createObjectURL(file);
                      setImagePreview(previewUrl);
                    }
                  }}
                  className="w-full rounded-lg border border-border bg-input p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Previsualización"
                    className="mt-2 rounded-lg max-w-xs"
                  />
                )}
              </div>
              {/* Nombre */}
              <div>
                <label
                  htmlFor="nombre"
                  className="text-muted block mb-2 text-sm"
                >
                  Nombre
                </label>
                <input
                  id="nombre"
                  type="text"
                  placeholder="Nombre del producto"
                  {...register("nombre")}
                  className="w-full rounded-lg border border-border bg-input p-3 text-foreground placeholder-muted/50 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {errors.nombre && (
                  <p className="text-error text-sm mt-1">
                    {errors.nombre.message}
                  </p>
                )}
              </div>
              {/* Descripción */}
              <div>
                <label
                  htmlFor="descripcion"
                  className="text-muted block mb-2 text-sm"
                >
                  Descripción
                </label>
                <input
                  id="descripcion"
                  type="text"
                  placeholder="Descripción del producto"
                  {...register("descripcion")}
                  className="w-full rounded-lg border border-border bg-input p-3 text-foreground placeholder-muted/50 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {errors.descripcion && (
                  <p className="text-error text-sm mt-1">
                    {errors.descripcion.message}
                  </p>
                )}
              </div>
              {/* Stock */}
              <div>
                <label
                  htmlFor="stock"
                  className="text-muted block mb-2 text-sm"
                >
                  Stock
                </label>
                <input
                  id="stock"
                  type="number"
                  placeholder="Stock"
                  {...register("stock")}
                  className="w-full rounded-lg border border-border bg-input p-3 text-foreground placeholder-muted/50 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {errors.stock && (
                  <p className="text-error text-sm mt-1">
                    {errors.stock.message}
                  </p>
                )}
              </div>
              {/* Color */}
              <div>
                <label
                  htmlFor="color"
                  className="text-muted block mb-2 text-sm"
                >
                  Color
                </label>
                <input
                  id="color"
                  type="text"
                  placeholder="Color"
                  {...register("color")}
                  className="w-full rounded-lg border border-border bg-input p-3 text-foreground placeholder-muted/50 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {errors.color && (
                  <p className="text-error text-sm mt-1">
                    {errors.color.message}
                  </p>
                )}
              </div>
              {/* Precio */}
              <div>
                <label
                  htmlFor="precio"
                  className="text-muted block mb-2 text-sm"
                >
                  Precio
                </label>
                <input
                  id="precio"
                  type="number"
                  placeholder="Precio"
                  {...register("precio")}
                  className="w-full rounded-lg border border-border bg-input p-3 text-foreground placeholder-muted/50 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {errors.precio && (
                  <p className="text-error text-sm mt-1">
                    {errors.precio.message}
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditProducto(null);
                    reset();
                    setImagePreview(null);
                    setIsModalOpen(false);
                  }}
                  className="rounded-lg border border-border text-muted/80 p-3 transition-colors duration-300 hover:bg-muted/5 hover:text-foreground"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary border border-blue-400 text-white p-3 transition-colors duration-300 hover:bg-opacity-90"
                >
                  {editProducto ? "Actualizar" : "Cargar producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductsScreen;
