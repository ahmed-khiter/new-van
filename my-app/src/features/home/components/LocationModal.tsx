import React from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LOCATION_OPTIONS } from "@/features/home/constants/homeContent";
import type { Location } from "@/features/home/types";

type Props = {
  visible: boolean;
  pendingLocation: Location;
  onSelectLocation: (location: Location) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export default function LocationModal({
  visible,
  pendingLocation,
  onSelectLocation,
  onClose,
  onConfirm,
}: Props) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.bottomSheet}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Choose Location</Text>
                <Pressable
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialIcons name="close" size={22} color="#6b7280" />
                </Pressable>
              </View>

              {/* Location Grid */}
              <FlatList
                data={LOCATION_OPTIONS}
                numColumns={2}
                columnWrapperStyle={styles.columnWrapper}
                keyExtractor={(item) => item.code}
                renderItem={({ item }) => {
                  const isSelected = pendingLocation.code === item.code;
                  return (
                    <Pressable
                      style={[
                        styles.locationCard,
                        isSelected
                          ? styles.locationCardSelected
                          : styles.locationCardDefault,
                      ]}
                      onPress={() => onSelectLocation(item)}
                    >
                      <View style={styles.locationCardContent}>
                        <Text style={styles.locationFlag}>{item.flag}</Text>
                        <Text style={styles.locationName}>{item.name}</Text>
                      </View>
                      {isSelected && (
                        <MaterialIcons name="check" size={18} color="#ff4d77" />
                      )}
                    </Pressable>
                  );
                }}
                scrollEnabled={false}
              />

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.selectedText}>
                  Selected: {pendingLocation.flag} {pendingLocation.name}
                </Text>
                <Pressable
                  style={styles.continueButton}
                  onPress={onConfirm}
                  android_ripple={{ color: "#ff1456" }}
                >
                  <Text style={styles.continueButtonText}>Continue</Text>
                </Pressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.36)",
    justifyContent: "flex-end",
  },
  bottomSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a1a2e",
  },
  columnWrapper: {
    gap: 8,
  },
  locationCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  locationCardDefault: {
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  locationCardSelected: {
    borderColor: "#ffd3df",
    backgroundColor: "#fff5f8",
  },
  locationCardContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  locationFlag: {
    fontSize: 22,
  },
  locationName: {
    fontSize: 13,
    fontFamily: "OpenSans_600SemiBold",
    color: "#111827",
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },
  selectedText: {
    fontSize: 13,
    color: "#6b7280",
  },
  continueButton: {
    backgroundColor: "#ff4d77",
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  continueButtonText: {
    fontSize: 14,
    fontFamily: "OpenSans_700Bold",
    color: "#fff",
  },
});
