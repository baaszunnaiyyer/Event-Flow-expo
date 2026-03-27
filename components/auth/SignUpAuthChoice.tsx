import { Text } from "@/components/AppTypography";
import { BACKGROUND_COLOR, PRIMARY_COLOR, getAuthHeroImageStyle } from "@/constants/constants";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  loading: boolean;
  onGoogle: () => void;
  onEmail: () => void;
  onLogin: () => void;
};

export function SignUpAuthChoice({ loading, onGoogle, onEmail, onLogin }: Props) {
  const screenWidth = Dimensions.get("window").width;
  const inputWidth = screenWidth * 0.8;

  const trigger = (fn: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    fn();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={require("../../assets/images/undraw_stars_5pgw.png")}
          style={getAuthHeroImageStyle()}
          resizeMode="contain"
        />

        <View style={{ width: inputWidth }}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Join us to get started</Text>

          <TouchableOpacity
            style={styles.emailBtn}
            onPress={() => trigger(onEmail)}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Ionicons name="mail-outline" size={20} color="#fff" style={{ marginRight: 10 }} />
            <Text style={styles.emailBtnText}>Sign up with email</Text>
          </TouchableOpacity>

          <View style={styles.separatorContainer}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>OR</Text>
            <View style={styles.separatorLine} />
          </View>

          <TouchableOpacity
            style={styles.googleBtn}
            onPress={() => trigger(onGoogle)}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={PRIMARY_COLOR} />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color="#000" style={{ marginRight: 8 }} />
                <Text style={styles.googleBtnText}>Sign up with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.footerText}>
            Already have an account?
            <TouchableOpacity onPress={() => trigger(onLogin)}>
              <Text style={styles.linkText}> Log in</Text>
            </TouchableOpacity>
          </Text>
        </View>
      </ScrollView>
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
  scrollContent: {
    alignItems: "center",
    paddingTop: 0,
    paddingBottom: 40,
    flexGrow: 1,
  },
  title: {
    fontSize: 26,
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
  emailBtn: {
    flexDirection: "row",
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  emailBtnText: {
    color: "#fff",
    fontSize: 16,
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
    color: "#000",
  },
  footerText: {
    textAlign: "center",
    color: "#777",
    fontSize: 14,
  },
  linkText: {
    color: PRIMARY_COLOR,
    fontSize: 14,
  },
});
