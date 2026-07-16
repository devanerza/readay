import React from "react";
import { View, Text, Image, Pressable } from "react-native";

type Book = {
  title: string;
  author?: string;
  cover_url?: string;
};

type Props = {
  book: Book;
  size?: "sm" | "md" | "lg";
  onPress?: () => void;
};

const DIMENSIONS = {
  sm: { cover: { width: 80 }, gap: "gap-3" },
  md: { cover: { width: 100 }, gap: "gap-4" },
  lg: { cover: { width: 140 }, gap: "gap-4" },
};

export function BookCover({ book, size = "md", onPress }: Props) {
  const dim = DIMENSIONS[size];
  return (
    <Pressable onPress={onPress} className="shrink-0" style={{ width: dim.cover.width }}>
      <View className="aspect-[2/3] rounded-lg overflow-hidden bg-surface-variant">
        {book.cover_url ? (
          <Image source={{ uri: book.cover_url }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-outline font-display text-headline-md">
              {book.title?.[0] ?? "?"}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export function BookCardHorizontal({
  book,
  size = "md",
  onPress,
  reason,
  badge,
}: Props & { reason?: string; badge?: string }) {
  const dim = DIMENSIONS[size];
  return (
    <Pressable onPress={onPress} className="flex-row gap-4 p-4 bg-surface-container-low rounded-2xl border border-surface-variant/20">
      <BookCover book={book} size={size} />
      <View className="flex-1 gap-1 justify-center">
        <Text className="font-title-lg text-on-surface" numberOfLines={2}>{book.title}</Text>
        {book.author ? <Text className="text-caption text-on-surface-variant italic">{book.author}</Text> : null}
        {reason ? <Text className="text-caption text-outline mt-1" numberOfLines={2}>{reason}</Text> : null}
        {badge ? <Text className="text-caption text-primary font-label-md mt-1">{badge}</Text> : null}
      </View>
    </Pressable>
  );
}

export function BookCardVertical({
  book,
  size = "sm",
  onPress,
  subtitle,
}: Props & { subtitle?: string }) {
  const dim = DIMENSIONS[size];
  return (
    <Pressable onPress={onPress} className="shrink-0" style={{ width: dim.cover.width }}>
      <BookCover book={book} size={size} />
      <Text className="mt-2 font-label-md text-on-surface" numberOfLines={1}>{book.title}</Text>
      {subtitle ? <Text className="text-caption text-on-surface-variant">{subtitle}</Text> : null}
    </Pressable>
  );
}
