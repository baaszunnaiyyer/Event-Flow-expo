import { BACKGROUND_COLOR } from "@/constants/constants";
import { StyleSheet } from "react-native";

export const notificationStyles = StyleSheet.create({
  container: {
    paddingTop: 50,
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
    padding: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    marginTop: 10,
    color: "#090040",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  filterButton: {
    marginLeft: 10,
    backgroundColor: "#090040",
    padding: 10,
    borderRadius: 10,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    elevation: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#e4e4e4',
    marginHorizontal: 5,
  },
  activeTab: {
    backgroundColor: '#090040',
  },
  tabText: {
    color: '#333',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
});