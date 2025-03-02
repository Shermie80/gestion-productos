import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import { Button, TextField, Flex, Text } from "@radix-ui/themes";
import ProductsScreen from "./ProductsScreen";

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError("Error al iniciar sesión: " + error.message);
    } else {
      onLogin();
    }
  };

  return (
    <Flex
      direction="column"
      gap="4"
      align="center"
      p="4"
      style={{ minHeight: "100vh", backgroundColor: "var(--color-background)" }}
    >
      <Text size="6" weight="bold" mb="4">
        Iniciar Sesión
      </Text>
      <form onSubmit={handleLogin} style={{ width: "100%", maxWidth: "400px" }}>
        <TextField.Root
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          mb="3"
          size="3"
        />
        <TextField.Root
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          mb="3"
          size="3"
        />
        {error && (
          <Text color="red" mb="3">
            {error}
          </Text>
        )}
        <Button type="submit" size="3" variant="solid" color="blue">
          Iniciar Sesión
        </Button>
      </form>
    </Flex>
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
      }
    };
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN") {
          setUser(session.user);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (!user) {
    return (
      <LoginScreen onLogin={() => setUser(supabase.auth.getUser().data.user)} />
    );
  }

  return <ProductsScreen user={user} />;
}

export default App;
