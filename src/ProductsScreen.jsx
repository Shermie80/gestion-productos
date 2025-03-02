import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import logo from "./assets/logo-white.png";
import { FaPencilAlt, FaTrash } from "react-icons/fa"; // Íconos para editar y eliminar

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
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12; // 12 productos por página

  const fetchProductos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("productos")
        .select("*")
        .eq("usuario_id", user.id);
      if (error) {
        setError(`Error al cargar productos: ${error.message}`);
      } else {
        setProductos(data || []);
      }
    } catch (err) {
      setError(`Error inesperado: ${err.message}`);
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
        console.log("Subiendo imagen:", file.name);
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("productos")
          .upload(`public/${file.name}`, file, {
            upsert: false,
          });
        if (uploadError) {
          throw new Error(`Error al subir la imagen: ${uploadError.message}`);
        }
        imageUrl = `https://rbxndkerdxoomlvzpdcz.supabase.co/storage/v1/object/public/productos/public/${file.name}`; // URL pública
        console.log("URL de la imagen subida:", imageUrl);
      }

      console.log("Usuario ID:", user.id);

      const { error } = await supabase.from("productos").insert({
        nombre: data.nombre,
        descripcion: data.descripcion,
        stock: data.stock,
        color: data.color,
        precio: data.precio,
        usuario_id: user.id,
        imagen_url: imageUrl,
      });
      if (error) {
        throw new Error(`Error al agregar producto: ${error.message}`);
      } else {
        reset();
        setImagePreview(null);
        setIsModalOpen(false);
        await fetchProductos();
      }
    } catch (err) {
      setError(err.message);
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
        console.log("Subiendo imagen:", file.name);
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("productos")
          .upload(`public/${file.name}`, file, {
            upsert: false,
          });
        if (uploadError) {
          throw new Error(`Error al subir la imagen: ${uploadError.message}`);
        }
        imageUrl = `https://rbxndkerdxoomlvzpdcz.supabase.co/storage/v1/object/public/productos/public/${file.name}`; // URL pública
        console.log("URL de la imagen subida:", imageUrl);
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
        throw new Error(`Error al actualizar producto: ${error.message}`);
      } else {
        setEditProducto(null);
        reset();
        setImagePreview(null);
        setIsModalOpen(false);
        await fetchProductos();
      }
    } catch (err) {
      setError(err.message);
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

  // Paginación
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = productos.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );
  const totalPages = Math.ceil(productos.length / productsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen bg-background max-w-6xl mx-auto font-sans p-6">
      {/* Barra superior */}
      <header className="flex justify-between items-center pb-6 border-b border-border">
        <img src={logo} alt="Logo" className="w-32 md:w-48" />
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
        {currentProducts.length === 0 ? (
          <p className="text-muted text-lg text-center">No hay productos.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {currentProducts.map((producto) => (
              <div
                key={producto.id}
                className="bg-secondary border border-border rounded-lg shadow-md p-4 flex transition-transform duration-300 ease-in-out hover:translate-y-[-2px] hover:shadow-lg"
              >
                <div className="w-1/3">
                  {producto.imagen_url && (
                    <img
                      src={producto.imagen_url}
                      alt={producto.nombre}
                      className="rounded-lg w-full h-auto border border-border/50 shadow-lg object-cover"
                    />
                  )}
                </div>
                <div className="w-2/3 pl-4">
                  <p className="text-lg text-foreground">{producto.nombre}</p>
                  <p className="text-muted">{producto.descripcion}</p>
                  <p className="text-muted">
                    Stock: {producto.stock}, Color: {producto.color}, Precio: $
                    {producto.precio}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleEditarProducto(producto)}
                      className="p-2 text-muted/60 border border-border rounded-lg hover:text-opacity-80 transition-colors duration-300 hover:text-muted"
                    >
                      <FaPencilAlt />
                    </button>
                    <button
                      onClick={() => handleEliminarProducto(producto.id)}
                      className="p-2 text-muted/60 border border-border rounded-lg hover:text-opacity-80 transition-colors duration-300 hover:text-muted"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => paginate(i + 1)}
              className={`px-3 py-1 rounded-lg ${
                currentPage === i + 1
                  ? "bg-primary text-white"
                  : "bg-secondary text-foreground hover:bg-muted/5"
              } transition-colors duration-300`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

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
