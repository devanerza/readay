import React from "react";
import { View, Text, Modal, Pressable } from "react-native";
import Icon, { type IconName } from "./Icon";

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  icon = "delete",
  tone = "danger",
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  icon?: IconName;
  tone?: "danger" | "primary";
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isPrimary = tone === "primary";
  const iconColor = isPrimary ? "#52634c" : "#ba1a1a";
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/40">
        <View className="flex-1 justify-end">
          <View className="bg-surface rounded-t-3xl p-8 pb-12 gap-8">
            <View className="items-center gap-4">
              <View className={`p-4 rounded-3xl ${isPrimary ? "bg-primary/10" : "bg-error/10"}`}>
                <Icon name={icon} size={36} color={iconColor} />
              </View>
              <Text className="font-display text-headline-md text-on-surface text-center">{title}</Text>
              <Text className="font-body-md text-on-surface-variant text-center leading-relaxed">{message}</Text>
            </View>

            <View className="flex-row gap-4">
              <Pressable
                onPress={onCancel}
                className="flex-1 py-4 rounded-full bg-surface-variant items-center active:opacity-80"
              >
                <Text className="font-label-lg text-on-surface-variant">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={onConfirm}
                className={`flex-1 py-4 rounded-full items-center active:opacity-90 ${isPrimary ? "bg-primary" : "bg-error"}`}
              >
                <Text className="font-label-lg text-white">{confirmLabel}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
