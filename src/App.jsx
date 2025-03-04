import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import ProductsScreen from "./ProductsScreen";

const loginSchema = yup
  .object({
    email: yup
      .string()
      .email("Debe ser un email válido")
      .required("El email es requerido"),
    password: yup
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres")
      .required("La contraseña es requerida"),
  })
  .required();

function App() {
  const [user, setUser] = useState(null); // null significa "cargando", undefined significa "sin autenticar"
  const [error, setError] = useState("");
  const [randomTestimonial, setRandomTestimonial] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
  });

  const testimonials = [
    {
      text: "Antes usaba redes sociales para todo, pero necesitaba algo más para mostrar y detallar mis creaciones, el catálogo se ajustó a la medida.",
      name: "Sofía Hernández",
      title: "Creadora de Arte & Diseño.",
      avatar: "./src/assets/avatar.jpg",
    },
    {
      text: "Logré tener mi web sin gastar una fortuna. Ahora mis clientes pueden ver mi catálogo de productos y realizar consultas de forma sencilla. 100% recomendado!!",
      name: "María Guaglianone",
      title: "Emprendedora.",
      avatar: "./src/assets/avatar1.jpg",
    },
    {
      text: "Nos ayudaron a crear un catalogo de usados, ahora nuestros clientes encuentran información clara y agendan pruebas sin problemas. ¡Un gran aliado!",
      name: "Daniel Ríos",
      title: "Concesionaria.",
      avatar: "./src/assets/avatar2.jpg",
    },
  ];

  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          throw new Error(`Error al verificar sesión: ${error.message}`);
        }

        setUser(session?.user || undefined); // undefined si no hay usuario autenticado
      } catch (err) {
        setError(err.message);
        setUser(undefined); // Forzar salida del estado "cargando"
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || undefined);
      }
    );

    const randomIndex = Math.floor(Math.random() * testimonials.length);
    setRandomTestimonial(testimonials[randomIndex]);

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const onSubmit = async (data) => {
    try {
      setError("");
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        setError("Error al iniciar sesión: " + error.message);
        return;
      }

      if (authData.user) {
        setUser(authData.user);
      } else {
        setError("No se pudo obtener la información del usuario.");
      }
    } catch (err) {
      setError("Ocurrió un error inesperado: " + err.message);
    }
  };

  // Mostrar "Cargando..." solo si user es null
  if (user === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        Cargando...
      </div>
    );
  }

  // Mostrar pantalla de login o ProductsScreen según el estado de user
  return user ? (
    <ProductsScreen user={user} />
  ) : (
    <div className="w-full h-screen bg-background font-sans relative">
      <div className="fixed top-0 left-0 w-full z-10 flex justify-between items-center p-8">
        <img
          src="./src/assets/logo-white.png"
          alt="Logo"
          className="h-8 w-auto"
        />
        <a
          href="https://miwebly.com/contacto"
          className="text-muted/85 rounded-lg text-xs mt-1 bg-muted/5 border border-border py-1 px-4 hover:text-white"
        >
          Reportar error
        </a>
      </div>
      <div className="flex items-center justify-center h-full">
        <div className="rounded-lg w-full h-full flex flex-col justify-center md:flex-row">
          <div className="w-full md:w-1/2 p-8">
            <div className="max-w-md mx-auto h-full flex flex-col justify-center">
              <h2 className="text-4xl text-white font-semibold -tracking-[0.5px] text-balance mb-2">
                Bienvenido de nuevo
              </h2>
              <p className="text-muted/80 -tracking-[0.5px] mb-6">
                Inicia sesión con tu cuenta
              </p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="text-muted/70 block mb-2 text-sm"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="ejemplo@gmail.com"
                    {...register("email")}
                    className="w-full rounded-lg border border-border bg-secondary p-3 text-foreground placeholder-muted/50 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  {errors.email && (
                    <p className="text-error text-sm mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="text-muted/70 block text-sm mb-2"
                  >
                    Contraseña
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="Ingrese su contraseña"
                    {...register("password")}
                    className="w-full rounded-lg border border-border bg-secondary p-3 text-foreground placeholder-muted/50 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  {errors.password && (
                    <p className="text-error text-sm mt-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>
                {error && <p className="text-error/80 text-sm">{error}</p>}
                <button
                  type="submit"
                  className="w-full rounded-lg bg-primary border border-blue-400 text-white py-3 transition-colors duration-300 hover:bg-primary/70"
                >
                  Iniciar Sesión
                </button>
              </form>
              <div className="text-muted/75 mt-4 flex justify-center items-center gap-2">
                <p>¿Aún no sos cliente?</p>
                <a href="https://miwebly.com" className="text-white underline">
                  Hacé clic aquí
                </a>
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/2 hidden p-8 border-l border-border bg-backgroundtwo md:flex flex-col justify-center">
            <div className="max-w-2xl mx-auto h-full flex flex-col justify-center">
              {randomTestimonial && (
                <div>
                  <p className="text-muted italic text-4xl text-balance">
                    "{randomTestimonial.text}"
                  </p>
                  <div className="flex items-center mt-6">
                    <img
                      src={randomTestimonial.avatar}
                      alt="avatar cliente"
                      className="h-14 rounded-full"
                    />
                    <div className="ml-4">
                      <p className="text-muted font-medium">
                        {randomTestimonial.name}
                      </p>
                      <p className="text-muted/50 text-sm">
                        {randomTestimonial.title}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
