import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import ProductForm from "./ProductForm";
import logo from "./assets/logo-white.png";
import {
  FaPencilAlt,
  FaTrash,
  FaBars,
  FaTimes,
  FaBox,
  FaCog,
  FaSignOutAlt,
  FaList,
} from "react-icons/fa";

function ProductsScreen({ user }) {
  const [productos, setProductos] = useState([]);
  const [editProducto, setEditProducto] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterStock, setFilterStock] = useState("");
  const [filterColor, setFilterColor] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productoToDelete, setProductoToDelete] = useState(null);
  const productsPerPage = 12;

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("productos")
        .select("*")
        .eq("usuario_id", user.id);

      if (error) {
        throw error;
      }

      setProductos(data || []);
    } catch (err) {
      setError(`Error al cargar productos: ${err.message}`);
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarProducto = async ({
    nombre,
    descripcion,
    stock,
    color,
    precio,
  }) => {
    try {
      setLoading(true);
      let imageUrl = null;
      const file = document.getElementById("imagen")?.files?.[0];
      if (file) {
        const { error: uploadError } = await supabase.storage
          .from("productos")
          .upload(`public/${file.name}`, file);
        if (uploadError) {
          throw new Error(`Error al subir imagen: ${uploadError.message}`);
        }
        imageUrl = `https://rbxndkerdxoomlvzpdcz.supabase.co/storage/v1/object/public/productos/public/${file.name}`;
      }
      const { error } = await supabase.from("productos").insert({
        nombre,
        descripcion,
        stock,
        color,
        precio,
        usuario_id: user.id,
        imagen_url: imageUrl,
      });
      if (error) {
        throw new Error(`Error al agregar producto: ${error.message}`);
      }
      resetForm();
      await fetchProductos();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditarProducto = (producto) => {
    setEditProducto(producto);
    setImagePreview(producto.imagen_url);
    setIsAdding(true);
  };

  const handleActualizarProducto = async ({
    nombre,
    descripcion,
    stock,
    color,
    precio,
  }) => {
    try {
      setLoading(true);
      let imageUrl = editProducto.imagen_url;
      const file = document.getElementById("imagen")?.files?.[0];
      if (file) {
        const { error: uploadError } = await supabase.storage
          .from("productos")
          .upload(`public/${file.name}`, file);
        if (uploadError) {
          throw new Error(`Error al subir imagen: ${uploadError.message}`);
        }
        imageUrl = `https://rbxndkerdxoomlvzpdcz.supabase.co/storage/v1/object/public/productos/public/${file.name}`;
      }
      const { error } = await supabase
        .from("productos")
        .update({
          nombre,
          descripcion,
          stock,
          color,
          precio,
          imagen_url: imageUrl,
        })
        .eq("id", editProducto.id);
      if (error) {
        throw new Error(`Error al actualizar producto: ${error.message}`);
      }
      resetForm();
      await fetchProductos();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarProducto = async (id) => {
    try {
      setLoading(true);
      const { error } = await supabase.from("productos").delete().eq("id", id);
      if (error) {
        throw new Error(`Error al eliminar producto: ${error.message}`);
      }
      await fetchProductos();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
      setProductoToDelete(null);
    }
  };

  const confirmDelete = (producto) => {
    setProductoToDelete(producto);
    setShowDeleteConfirm(true);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setProductoToDelete(null);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      setError(`Error al cerrar sesión: ${err.message}`);
    }
  };

  const resetForm = () => {
    setEditProducto(null);
    setImagePreview(null);
    setIsAdding(false);
  };

  useEffect(() => {
    if (user && isInitialLoad) {
      fetchProductos();
      setIsInitialLoad(false);
    }
  }, [user, isInitialLoad]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        Cargando...
      </div>
    );
  }

  const filteredProducts = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(search.toLowerCase()) &&
      (filterStock === "" || p.stock >= parseInt(filterStock)) &&
      (filterColor === "" ||
        p.color.toLowerCase().includes(filterColor.toLowerCase()))
  );
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  return (
    <div className="min-h-screen bg-background flex font-sans">
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-secondary border-r border-border p-4 transform ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 z-50`}
      >
        <div className="flex justify-between items-center mb-6">
          <img src={logo} alt="Logo" className="w-44" />
          <button
            className="md:hidden text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
        <hr className="border-border my-4" />
        <h2 className="text-xl font-bold text-foreground mb-4">Menú</h2>
        <ul className="mb-6">
          <li
            className="py-2 text-muted hover:text-foreground cursor-pointer flex items-center gap-2"
            onClick={() => {
              setIsAdding(false);
              setEditProducto(null);
              setIsMenuOpen(false);
            }}
          >
            <FaList /> Productos
          </li>
          <li
            className="py-2 text-muted hover:text-foreground cursor-pointer flex items-center gap-2"
            onClick={() => {
              setIsAdding(true);
              setEditProducto(null);
              setIsMenuOpen(false);
            }}
          >
            <FaBox /> Añadir producto
          </li>
          <li className="py-2 text-muted hover:text-foreground cursor-pointer flex items-center gap-2">
            <FaCog /> Configuración
          </li>
        </ul>
        <hr className="border-border my-4" />
        <h2 className="text-xl font-bold text-foreground mb-4">Filtros</h2>
        <div className="space-y-4">
          <div>
            <label className="text-muted block mb-2 text-sm">Buscar</label>
            <input
              type="text"
              placeholder="Buscar productos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-input p-2 text-foreground"
            />
          </div>
          <div>
            <label className="text-muted block mb-2 text-sm">
              Stock mínimo
            </label>
            <input
              type="number"
              value={filterStock}
              onChange={(e) => setFilterStock(e.target.value)}
              className="w-full rounded-lg border border-border bg-input p-2 text-foreground"
            />
          </div>
          <div>
            <label className="text-muted block mb-2 text-sm">Color</label>
            <input
              type="text"
              value={filterColor}
              onChange={(e) => setFilterColor(e.target.value)}
              className="w-full rounded-lg border border-border bg-input p-2 text-foreground"
            />
          </div>
        </div>
      </aside>

      <div className="flex-1 md:ml-64">
        <header className="flex justify-between md:justify-end items-center p-4 bg-secondary border-b border-border">
          <button
            className="md:hidden text-foreground mr-4"
            onClick={() => setIsMenuOpen(true)}
          >
            <FaBars />
          </button>
          <button
            onClick={handleSignOut}
            className="rounded-lg border border-border text-white px-4 py-2 hover:bg-border/50"
          >
            Cerrar sesión
          </button>
        </header>

        <main className="p-4 md:p-8">
          {error && <p className="text-error text-sm mb-4">{error}</p>}
          {isAdding ? (
            <ProductForm
              onSubmit={
                editProducto ? handleActualizarProducto : handleAgregarProducto
              }
              onCancel={resetForm}
              editProducto={editProducto}
              loading={loading}
              error={error}
              imagePreview={imagePreview}
              setImagePreview={setImagePreview}
            />
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground">
                  Productos cargados
                </h2>
                <p className="text-muted text-sm mt-1">
                  Total: {filteredProducts.length} productos cargados.
                </p>
              </div>
              {currentProducts.length === 0 ? (
                <p className="text-muted text-lg text-center">
                  No hay productos.
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-4">
                  {currentProducts.map((producto) => (
                    <div
                      key={producto.id}
                      className="bg-secondary rounded-xl shadow-md border border-border flex flex-col justify-between hover:shadow-lg transition-shadow duration-300 max-w-[230px] w-full"
                    >
                      <div>
                        {producto.imagen_url ? (
                          <img
                            src={producto.imagen_url}
                            alt={producto.nombre}
                            className="w-full h-44 object-cover rounded-t-xl border-b border-border/20"
                          />
                        ) : (
                          <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-500">
                            Sin imagen
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        {" "}
                        {/* Padding para separar la imagen del contenido */}
                        <h3 className="text-lg font-semibold text-white mb-2 truncate">
                          {producto.nombre}
                        </h3>
                        <div className="space-y-2">
                          <p className="text-muted/80 text-sm mb-2 line-clamp-3 rounded">
                            {producto.descripcion}
                          </p>
                          <div className="text-muted text-sm space-y-1">
                            <p className="border border-border/80 bg-background w-fit px-2 py-0.5 rounded-md">
                              <span className="font-medium text-muted/75">
                                Stock:
                              </span>{" "}
                              {producto.stock}
                            </p>
                            <p className="border border-border/80 bg-background w-fit px-2 py-0.5 rounded-md">
                              <span className="font-medium text-muted/75">
                                Color:
                              </span>{" "}
                              {producto.color}
                            </p>
                            <p className="border border-border/80 bg-background w-fit px-2 py-0.5 rounded-md">
                              <span className="font-medium text-muted/75">
                                Precio:
                              </span>{" "}
                              ${producto.precio}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 flex justify-start gap-4">
                        <button
                          onClick={() => confirmDelete(producto)}
                          className="p-1 px-2 text-muted bg-muted/5 border border-border rounded-lg hover:text-red-500/80 hover:border-red-500/50 hover:bg-error/5 transition-colors duration-200"
                        >
                          <FaTrash className="h-3" />
                        </button>
                        <button
                          onClick={() => handleEditarProducto(producto)}
                          className="p-1 w-full flex items-center justify-center gap-2 text-muted bg-primary/25 border border-primary/20 rounded-lg hover:bg-primary/40  transition-colors duration-200"
                        >
                          <FaPencilAlt className="h-3" />
                          Editar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {totalPages > 1 && (
                <div className="mt-6 flex justify-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-3 py-1 rounded-lg ${
                        currentPage === i + 1
                          ? "bg-primary text-white"
                          : "bg-secondary text-foreground hover:bg-muted/5"
                      } transition-colors duration-200`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Popup de confirmación para eliminar */}
          {showDeleteConfirm && productoToDelete && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-background rounded-lg p-6 max-w-sm w-full shadow-lg border border-border">
                <h3 className="text-lg font-semibold text-white mb-4">
                  ¿Estás seguro?
                </h3>
                <p className="text-muted mb-6">
                  ¿Realmente deseas eliminar el producto "
                  {productoToDelete.nombre}"? Esta acción no se puede deshacer.
                </p>
                <div className="flex justify-between gap-4">
                  <button
                    onClick={cancelDelete}
                    className="px-4 py-2 text-muted border bg-muted/5 border-border rounded-lg hover:bg-muted/15 transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleEliminarProducto(productoToDelete.id)}
                    className="px-4 py-2 bg-red-500/75 uppercase border border-error text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default ProductsScreen;
