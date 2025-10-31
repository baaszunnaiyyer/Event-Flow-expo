import React, { useEffect, useState } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { API_BASE_URL } from "../../utils/constants";
import { BACKGROUND_COLOR, PRIMARY_COLOR } from "@/constants/constants";

import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, getAuth, signInWithCredential } from '@react-native-firebase/auth';
import Toast from "react-native-toast-message";
import { Creator } from "@/types/model";
import { queueDB } from "@/utils/db/DatabaseQueue";
import { upsertTable } from "@/utils/db/SyncDB";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const screenWidth = Dimensions.get("window").width;
  const inputWidth = screenWidth * 0.8;

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  
  GoogleSignin.configure({
    webClientId: '556429365376-7s2h4hid83pfn2gv14ga627pjh9un5ai.apps.googleusercontent.com',
  });

  const signIn = async () => {    
    setLoading(true)
    try {
      // Ensure Play Services are available
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // ✅ Force sign out first so popup always appears
      await GoogleSignin.signOut();
      
      // Get the users ID token
      const signInResult = await GoogleSignin.signIn();

      const response  = await fetch(`${API_BASE_URL}/auth/google`, {
        method : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body : JSON.stringify({idToken : signInResult.data?.idToken})
      });

      const data = await response.json(); // 👈 parse actual JSON

      if (response.status === 201) {
        
      } else if (response.status === 200) {
        await SecureStore.setItemAsync("userToken", data.token);
        await SecureStore.setItemAsync("userId", data.user.user_id)
        const res = await fetch(`${API_BASE_URL}/settings`, { headers: { Authorization: data.token } })
        const settingResData: Creator = await res.json();

        queueDB(()=>
          upsertTable("users", ["user_id"], [settingResData], 
            [
              "user_id",
              "name", 
              "email", 
              "phone", 
              "date_of_birth", 
              "gender", 
              "country", 
              "is_private", 
              "availability_day_of_week", 
              "availability_start_time", 
              "availability_end_time", 
              "timezone", 
              "created_at", 
              "updated_at", 
              "status"
            ])
        )

        router.replace("/(tabs)");
      } else {
        Toast.show({
          type : 'error',
          text1 : "Error",
          text2 : `Unexpected status: ${response.status}`
        });
        setLoading(false);
        return;
      }

      // Try the new style of google-sign in result, from v13+ of that module
      const idToken = signInResult.data?.idToken;      
      
      if (!idToken) {
        throw new Error('No ID token found');
      }

      // Create a Google credential with the token
      const googleCredential = GoogleAuthProvider.credential(idToken);
      

      setLoading(false)
      // Sign-in the user with Firebase
      return signInWithCredential(getAuth(), googleCredential);

    } catch (error : any) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            Toast.show({
              type: "info",
              text1: "Sign-In",
              text2: "Sign-in already in progress",
            });
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            Toast.show({
              type: "error",
              text1: "Google Sign-In",
              text2: "Play Services not available or outdated",
            });
            break;
          default:
            Toast.show({
              type: "error",
              text1: "Google Sign-In Error",
              text2: error.message || "Something went wrong",
            });
        }
      } else {
        Toast.show({
          type: "error",
          text1: "Unknown Error",
          text2: error.message || "An unexpected error occurred",
        });
      }
    }
    finally {
      setLoading(false)
    }
  };

  useEffect(() => {
    if (email.length === 0) {
      setEmailError("");
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setEmailError(emailRegex.test(email) ? "" : "Invalid email format");
    }
  }, [email]);

  useEffect(() => {
    if (password.length === 0) {
      setPasswordError("");
    } else {
      setPasswordError(password.length < 1 ? "Password is required" : "");
    }
  }, [password]);

  useEffect(() => {
    const checkToken = async () => {
      const token = await SecureStore.getItemAsync("userToken");
      const id = await SecureStore.getItemAsync("userId")
      if (token && id) {        
        router.replace("/(tabs)");
      }
    };
    checkToken();
  }, []);


  const handleLogin = async () => {
    if (!email || !password || emailError || passwordError) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.token) {

        if(data.status === "active"){
          await SecureStore.setItemAsync("userToken", data.token);
          await SecureStore.setItemAsync("userId", data.userId)
          router.replace("/(tabs)");
        }else if (data.status === "pending"){
          Toast.show({type: 'info', text1 : "Needs Verification", text2: "Please Check Your Email and Activate your account!"})
        }else {
          Toast.show({type: 'info', text1 : "Account Deactivated", text2: "Please Contact Our Support Team If you Havent Deactivated This account"})
        }
      } else {
        Toast.show({type : 'error', text1 : "Error", text2 : `Login Failed, ${data.message} ` || `Invalid credentials.`});
      }
    } catch (error) {
      console.error("Login Error:", error);
      Toast.show({type:'error', text1 : "Error", text2 : "Error, Something went wrong. Please try again."});
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/undraw_stars_5pgw.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        style={{ width: inputWidth }}
      >
        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>Login to continue</Text>

        <TextInput
          style={[styles.input, { width: inputWidth }]}
          placeholder="Email"
          placeholderTextColor="#888"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Password"
            placeholderTextColor="#888"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={24}
              color="#888"
            />
          </TouchableOpacity>
        </View>
        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

        <TouchableOpacity onPress={()=> router.push('./forgetPassword')} style={styles.forgetPassword}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLogin}
          style={styles.loginBtn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginText}>Login</Text>
          )}
        </TouchableOpacity>

        {/* Separator */}
        <View style={styles.separatorContainer}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>OR</Text>
          <View style={styles.separatorLine} />
        </View>

        {/* Google Login Button */}
        <TouchableOpacity
          style={styles.googleBtn}
          onPress={signIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={PRIMARY_COLOR} />
          ): (
            <>
              <Ionicons name="logo-google" size={20} color="#000" style={{ marginRight: 8 }} />
              <Text style={styles.googleBtnText}>Sign in with Google</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Don’t have an account?
          <TouchableOpacity onPress={() => router.push("../signup")}>
            <Text style={styles.linkText}> Sign Up</Text>
          </TouchableOpacity>
        </Text>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(247, 247, 247, 1)",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: "65%",
    height: "20%",
    marginBottom: 100,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: PRIMARY_COLOR,
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: PRIMARY_COLOR,
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    height: 50,
    backgroundColor: BACKGROUND_COLOR,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2.22,
    elevation: 2,
    color: "#000",
  },
  passwordContainer: {
    position: "relative",
    width: "100%",
  },
  passwordInput: {
    paddingRight: 45,
  },
  eyeIcon: {
    position: "absolute",
    right: 15,
    top: 13,
  },
  forgetPassword: {
    alignSelf: "flex-end",
  },
  forgotText: {
    color: PRIMARY_COLOR,
    fontSize: 13,
    fontWeight: "500",
  },
  loginBtn: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
    elevation: 5,
  },
  loginText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ccc",
  },
  separatorText: {
    marginHorizontal: 10,
    fontSize: 14,
    color: "#777",
    fontWeight: "500",
  },
  googleBtn: {
    flexDirection: "row",
    backgroundColor: BACKGROUND_COLOR,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    marginBottom: 20,
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#000",
  },
  footerText: {
    textAlign: "center",
    color: "#777",
    fontSize: 14,
  },
  linkText: {
    color: PRIMARY_COLOR,
    fontWeight: "600",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: -15,
    marginBottom: 15,
    paddingLeft: 5,
  },
});


