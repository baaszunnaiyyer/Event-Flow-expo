// Dashboard.styles.ts
import { StyleSheet } from "react-native";
import { BACKGROUND_COLOR, PRIMARY_COLOR } from "@/constants/constants";

export const dashboardStyles = StyleSheet.create({
  scrollContainer: {
    paddingBottom: 120,
    backgroundColor: BACKGROUND_COLOR,
  },
  horizontalScroll: {
    padding: 0,
    flexDirection: "row",
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    paddingLeft: 16,
    color: "#111",
    marginTop: 32,
    marginBottom: 16,
    fontWeight: "800",
  },
  cardChart: {
    backgroundColor: BACKGROUND_COLOR,
    padding: 16,
    paddingBottom: 0,
    marginBottom: 1,
  },
  chartWrapper: {
    marginTop: 24,
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    width: 320,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#111",
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginBottom: 12,
  },
  eventRow: {
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#222",
    marginBottom: 2,
  },
  eventTime: {
    fontSize: 13,
    color: "#666",
  },
  fabContainer: {
    position: "absolute",
    bottom: 120,
    right: 20,
    alignItems: "center",
  },
  fab: {
    backgroundColor: PRIMARY_COLOR,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  subFab: {
    position: "absolute",
    bottom: 0,
    right: 0,
  },
  fabButton: {
    backgroundColor: PRIMARY_COLOR,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
});
