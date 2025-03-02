import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const productSchema = yup
  .object({
    nombre: yup.string().required("El nombre del producto es requerido"),
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
  } = useForm({
    resolver: yupResolver(productSchema),
  });
  const [productos, setProductos] = useState([]);
  const [editProducto, setEditProducto] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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
      const { error } = await supabase.from("productos").insert({
        nombre: data.nombre,
        precio: parseFloat(data.precio) || 0,
        usuario_id: user.id,
      });
      if (error) {
        setError("Error al agregar producto: " + error.message);
      } else {
        reset(); // Limpia el formulario
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
    reset({ nombre: producto.nombre, precio: producto.precio }); // Llena el formulario con los datos del producto
  };

  const handleActualizarProducto = async (data) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("productos")
        .update({
          nombre: data.nombre,
          precio: parseFloat(data.precio) || 0,
        })
        .eq("id", editProducto.id);
      if (error) {
        setError("Error al actualizar producto: " + error.message);
      } else {
        setEditProducto(null);
        reset(); // Limpia el formulario
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        Cargando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans p-6">
      <h1 className="text-2xl font-semibold text-white -tracking-[0.5px] mb-6">
        Gestión de Productos
      </h1>
      <div className="bg-secondary border border-border rounded-lg shadow-lg p-6">
        <form
          onSubmit={handleSubmit(
            editProducto ? handleActualizarProducto : handleAgregarProducto
          )}
          className="space-y-4"
        >
          <div>
            <label htmlFor="nombre" className="text-gray-300 block mb-1">
              Nombre del producto
            </label>
            <input
              id="nombre"
              type="text"
              placeholder="Nombre del producto"
              {...register("nombre")}
              className="w-full rounded-lg border border-border bg-input p-3 text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.nombre && (
              <p className="text-error text-sm mt-1">{errors.nombre.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="precio" className="text-gray-300 block mb-1">
              Precio
            </label>
            <input
              id="precio"
              type="number"
              placeholder="Precio"
              {...register("precio")}
              className="w-full rounded-lg border border-border bg-input p-3 text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.precio && (
              <p className="text-error text-sm mt-1">{errors.precio.message}</p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-lg bg-primary text-white p-3 transition-colors duration-300 hover:bg-opacity-90 hover:scale-105"
            >
              {editProducto ? "Actualizar" : "Agregar"}
            </button>
            {editProducto && (
              <button
                type="button"
                onClick={() => {
                  setEditProducto(null);
                  reset();
                }}
                className="rounded-lg border border-primary text-primary p-3 transition-colors duration-300 hover:bg-muted hover:text-foreground"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {error && <p className="text-error text-sm mt-2">{error}</p>}

      <div className="mt-6">
        {productos.length === 0 ? (
          <p className="text-muted text-lg">No hay productos.</p>
        ) : (
          <div className="space-y-4 ">
            {productos.map((producto) => (
              <div
                key={producto.id}
                className="bg-secondary border border-border rounded-lg shadow-md p-4 flex justify-between items-center transition-transform duration-300 ease-in-out hover:translate-y-[-2px] hover:shadow-lg"
              >
                <p className="text-lg  text-foreground">
                  {producto.nombre} - ${producto.precio}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditarProducto(producto)}
                    className="text-primary hover:text-opacity-80"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEliminarProducto(producto.id)}
                    className="text-error hover:text-opacity-80"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductsScreen;
