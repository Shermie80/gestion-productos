// src/ProductsScreen.jsx
import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import {
  Button,
  TextField,
  Flex,
  Text,
  Card,
  Box,
  IconButton,
} from "@radix-ui/themes";
import { TrashIcon, Pencil1Icon } from "@radix-ui/react-icons";

function ProductsScreen({ user }) {
  const [productos, setProductos] = useState([]);
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: "",
    precio: "",
  });
  const [editProducto, setEditProducto] = useState(null);
  const [error, setError] = useState("");

  const fetchProductos = async () => {
    const { data, error } = await supabase
      .from("productos")
      .select("*")
      .eq("usuario_id", user.id);
    if (error) {
      setError("Error al cargar productos: " + error.message);
    } else {
      setProductos(data || []);
    }
  };

  const handleAgregarProducto = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from("productos").insert({
      nombre: nuevoProducto.nombre,
      precio: parseFloat(nuevoProducto.precio) || 0,
      usuario_id: user.id,
    });
    if (error) {
      setError("Error al agregar producto: " + error.message);
    } else {
      setNuevoProducto({ nombre: "", precio: "" });
      fetchProductos();
    }
  };

  const handleEditarProducto = (producto) => {
    setEditProducto(producto);
    setNuevoProducto({ nombre: producto.nombre, precio: producto.precio });
  };

  const handleActualizarProducto = async (e) => {
    e.preventDefault();
    const { error } = await supabase
      .from("productos")
      .update({
        nombre: nuevoProducto.nombre,
        precio: parseFloat(nuevoProducto.precio) || 0,
      })
      .eq("id", editProducto.id);
    if (error) {
      setError("Error al actualizar producto: " + error.message);
    } else {
      setEditProducto(null);
      setNuevoProducto({ nombre: "", precio: "" });
      fetchProductos();
    }
  };

  const handleEliminarProducto = async (id) => {
    const { error } = await supabase.from("productos").delete().eq("id", id);
    if (error) {
      setError("Error al eliminar producto: " + error.message);
    } else {
      fetchProductos();
    }
  };

  useEffect(() => {
    fetchProductos();
  }, [user.id]);

  return (
    <Flex
      direction="column"
      gap="4"
      p="4"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      <Text size="6" weight="bold">
        Gestión de Productos
      </Text>
      <Card>
        <form
          onSubmit={
            editProducto ? handleActualizarProducto : handleAgregarProducto
          }
        >
          <Flex gap="3" direction="column">
            <TextField.Root
              type="text"
              placeholder="Nombre del producto"
              value={nuevoProducto.nombre}
              onChange={(e) =>
                setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })
              }
              size="3"
            />
            <TextField.Root
              type="number"
              placeholder="Precio"
              value={nuevoProducto.precio}
              onChange={(e) =>
                setNuevoProducto({ ...nuevoProducto, precio: e.target.value })
              }
              size="3"
            />
            <Flex gap="2">
              <Button type="submit" size="3" variant="solid" color="blue">
                {editProducto ? "Actualizar" : "Agregar"}
              </Button>
              {editProducto && (
                <Button
                  onClick={() => {
                    setEditProducto(null);
                    setNuevoProducto({ nombre: "", precio: "" });
                  }}
                  size="3"
                  variant="outline"
                >
                  Cancelar
                </Button>
              )}
            </Flex>
          </Flex>
        </form>
      </Card>

      {error && (
        <Text color="red" mt="2">
          {error}
        </Text>
      )}

      <Box>
        {productos.length === 0 ? (
          <Text>No hay productos.</Text>
        ) : (
          <Flex direction="column" gap="3">
            {productos.map((producto) => (
              <Card
                key={producto.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text>
                  {producto.nombre} - ${producto.precio}
                </Text>
                <Flex gap="2">
                  <IconButton
                    variant="ghost"
                    color="blue"
                    onClick={() => handleEditarProducto(producto)}
                  >
                    <Pencil1Icon />
                  </IconButton>
                  <IconButton
                    variant="ghost"
                    color="red"
                    onClick={() => handleEliminarProducto(producto.id)}
                  >
                    <TrashIcon />
                  </IconButton>
                </Flex>
              </Card>
            ))}
          </Flex>
        )}
      </Box>
    </Flex>
  );
}

export default ProductsScreen;
