import React from "react";
import { View, Text, Modal, Pressable } from "react-native";
import Icon, { type IconName } from "./Icon";

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  icon = "delete",
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  icon?: IconName;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/40">
        <View className="flex-1 justify-end">
          <View className="bg-surface rounded-t-3xl p-8 pb-12 gap-8">
            <View className="items-center gap-4">
              <View className="p-4 bg-error/10 rounded-3xl">
                <Icon name={icon} size={36} color="#ba1a1a" />
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
                className="flex-1 py-4 rounded-full bg-error items-center active:opacity-90"
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
