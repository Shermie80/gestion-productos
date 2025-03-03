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
} from "react-icons/fa";

function ProductsScreen({ user }) {
  const [productos, setProductos] = useState([]);
  const [editProducto, setEditProducto] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // Iniciar en false para evitar "Cargando" inicial innecesario
  const [imagePreview, setImagePreview] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterStock, setFilterStock] = useState("");
  const [filterColor, setFilterColor] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
      setProductos([]); // Asegurarse de que productos esté vacío si falla
    } finally {
      setLoading(false); // Asegurarse de que loading se desactive siempre
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
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null); // Esto debería manejarse en App.jsx vía onAuthStateChange
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
    if (user) {
      fetchProductos();
    }
  }, [user]);

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
          <img src={logo} alt="Logo" className="w-32" />
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
          <li
            className="py-2 text-muted hover:text-foreground cursor-pointer flex items-center gap-2"
            onClick={handleSignOut}
          >
            <FaSignOutAlt /> Cerrar sesión
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
        <header className="flex justify-between items-center p-4 bg-secondary border-b border-border">
          <button
            className="md:hidden text-foreground"
            onClick={() => setIsMenuOpen(true)}
          >
            <FaBars />
          </button>
          <button
            onClick={handleSignOut}
            className="rounded-lg bg-primary border border-blue-400 text-white px-4 py-2 hover:bg-opacity-90"
          >
            Cerrar sesión
          </button>
        </header>

        <main className="p-6">
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
              {currentProducts.length === 0 ? (
                <p className="text-muted text-lg text-center">
                  No hay productos.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full bg-secondary border border-border rounded-lg shadow-md">
                    <thead>
                      <tr className="bg-muted/10 text-foreground text-left">
                        <th className="p-3">Imagen</th>
                        <th className="p-3">Nombre</th>
                        <th className="p-3">Descripción</th>
                        <th className="p-3">Stock</th>
                        <th className="p-3">Color</th>
                        <th className="p-3">Precio</th>
                        <th className="p-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentProducts.map((producto) => (
                        <tr
                          key={producto.id}
                          className="border-t border-border hover:bg-muted/5 transition-colors duration-200"
                        >
                          <td className="p-3">
                            {producto.imagen_url && (
                              <img
                                src={producto.imagen_url}
                                alt={producto.nombre}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            )}
                          </td>
                          <td className="p-3 text-foreground">
                            {producto.nombre}
                          </td>
                          <td className="p-3 text-muted">
                            {producto.descripcion}
                          </td>
                          <td className="p-3 text-muted">{producto.stock}</td>
                          <td className="p-3 text-muted">{producto.color}</td>
                          <td className="p-3 text-muted">${producto.precio}</td>
                          <td className="p-3 flex gap-2">
                            <button
                              onClick={() => handleEditarProducto(producto)}
                              className="p-2 text-muted/60 border border-border rounded-lg hover:text-primary hover:border-primary transition-colors duration-200"
                            >
                              <FaPencilAlt />
                            </button>
                            <button
                              onClick={() =>
                                handleEliminarProducto(producto.id)
                              }
                              className="p-2 text-muted/60 border border-border rounded-lg hover:text-error hover:border-error transition-colors duration-200"
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
        </main>
      </div>
    </div>
  );
}

export default ProductsScreen;
