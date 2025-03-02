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

function LoginScreen({ onLogin }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
  });
  const [error, setError] = useState("");

  const onSubmit = async (data) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) {
      setError("Error al iniciar sesión: " + error.message);
    } else {
      onLogin();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center font-sans">
      <div className="rounded-lg p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold text-foreground -tracking-[0.5px] mb-1.5">
          Bienvenido de nuevo
        </h1>
        <p className="text-muted/80 -tracking-[0.5px] mb-6">
          Inicia sesión en tu cuenta
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="text-muted block mb-2 text-sm">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="ejemplo@gmail.com"
              {...register("email")}
              className="w-full rounded-lg border border-border bg-input p-3 text-foreground placeholder-muted/50 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.email && (
              <p className="text-error text-sm mt-1">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="password" className="text-muted block text-sm mb-2">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              placeholder="Contraseña"
              {...register("password")}
              className="w-full rounded-lg border border-border bg-input p-3 text-foreground placeholder-muted/50 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.password && (
              <p className="text-error text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>
          {error && <p className="text-error text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-lg bg-primary border border-blue-400 text-white py-2 transition-colors duration-300 hover:bg-opacity-90"
          >
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    };
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN") {
          setUser(session?.user || null);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        Cargando...
      </div>
    );
  }

  return user ? (
    <ProductsScreen user={user} />
  ) : (
    <LoginScreen onLogin={() => setUser(supabase.auth.getUser().data.user)} />
  );
}

export default App;
