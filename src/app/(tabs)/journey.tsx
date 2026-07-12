import React from "react";
import { View, Text, ScrollView, Image, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon, { type IconName } from "../../components/Icon";

const AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAKwVJhO6wHYkdV1vz1r1gYoh2xOXFNkS3RbehH2CGT_cd_olE2Dt537qQxp_FSfDPTXWEZviB5ciNnCELMTGdPkILYaaChWc6XZELWd9ZTssK1A6OxSxc28kLPTY7NVcapDKaJKJDEPtJK84txAduIOe8KUSq0UM-XEYhIZpATOos9sImaS14jdaCubmZ7PlTi5MfCjEueMxoaVCVeFTeRjCULndzyYB5tXCK2br7rw4SDkE1_Tdc0Nw";

const HIGHLIGHTS = [
  {
    title: "The Silent Patient",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBcbH_MGxb3GeC43Zc-psfbrbmvyKxF8BY4R2cJW_7bjqgUOZOVEZ4ic__gY9litIM-sgw3s-Z60VdhtP4PpWmt_8IcM53tMgVK_y4Llaec_5cBTwoKWuJ91By5qjUI3kLAoMeXF2WXTndQ2e4qhVrn5-YEMydr0n1_f0HDgk0EdNoLAFVMJBvpCLmXa0yAOF6bmCSeyAnWQYg1lBBHJ0HtYErDVX3B5rNLSI_QmRmAYAnllfLtY2M1og",
  },
  {
    title: "Atomic Habits",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBYz_kkk4fRuoRHNW1L1IbjDrOub9gA2BtpKb2cpzVaaFvz81KwWhuPs2jkXGDfgvyXngiOxFA1_vFe7Seu_BySSRthD0nidCE2xLcYkyRKUFG3Qfhgktpspwu_HLlnACZ7JgVgtztLo_YJCyw622ZUKXPJPnpMb6NlLq1BtE3LU5j4wDyO3GzJFkE89kh-5IXfLnjjyKKY5-qQMIF4eGJYUBLH5XT9HDbs_dRyXf8BMAqainDuzPircQ",
  },
  {
    title: "Braiding Sweetgrass",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuClH7hdxhB7yOiXiTyzVoLn8HrDQxxJx61Ort3bDetsnUqbat1L1eYCQE34DiOVhIq66eTJhW4kY06C3R9aH22HRcZh5YmYrNfFRbRxmPup8RUv9wQEyvBtGSu4Y9EqeTsaePTCNrHVVP_BcbXAH1pwQTcQtCij2Cd4K73zAwUamZdPGeUi64tWpoNbmJyFovM0P0b9R7nUxVHeWaYRL-tCvlNLrRHXeFMwHOyaHRUaFcuc5v4wX8YpTg",
  },
  {
    title: "Tomorrow, and Tomorrow",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA5457NU5ZtOAGmd-6p46z0OipJuA0cbW0uemrHiabFXpXr8Bt7Twg2n8HYYSVn7zkCkFBCvci4nhmzQJajoTeiwbtun3RWZbBnAgp0WuacbInZkFtziWHDxzlztapY8AolxZldQOyZEFezMmJBz5C23rSz-XwfzVl0KmtjmHCks7g2_nZp2Aqt4oYyfcPbCfu2ZQjCxMNhq2fOn4QDzHY4uYrWH4QIrdStIeNE_fFnAlwst9oPbWrwKw",
  },
];

const VINE_DOTS = [
  { size: 12, color: "bg-primary" },
  { size: 16, color: "bg-primary" },
  { size: 8, color: "bg-outline-variant" },
  { size: 20, color: "bg-primary" },
  { size: 12, color: "bg-primary" },
  { size: 16, color: "bg-primary" },
  { size: 12, color: "bg-outline-variant" },
  { size: 24, color: "bg-primary-container" },
];

export default function Journey() {
  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView edges={["top"]} className="flex-1">
        {/* Top App Bar */}
        <View className="w-full flex-row justify-between items-center px-margin-page py-4">
          <View className="flex-row items-center gap-4">
            <Icon name="menu" color="#52634c" />
            <Text className="font-display text-headline-md text-primary ml-4">ReadFlow</Text>
          </View>
          <View className="w-10 h-10 rounded-full overflow-hidden bg-surface-container border border-outline-variant">
            <Image source={{ uri: AVATAR }} className="w-full h-full" resizeMode="cover" />
          </View>
        </View>

        <ScrollView
          className="flex-1 px-margin-page"
          contentContainerStyle={{ paddingBottom: 120, gap: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View className="gap-3 mt-2">
            <Text className="font-label-md text-secondary uppercase tracking-widest">Autumn Chapter</Text>
            <Text className="font-display text-[38px] leading-[44px] text-on-surface">
              Your reading narrative continues to unfold.
            </Text>
            <Text className="font-body-lg text-on-surface-variant">
              This month, you've wandered through four distinct worlds, favoring the quiet introspection of
              non-fiction over your usual thrillers.
            </Text>
          </View>

          {/* Consistency Vine */}
          <View className="p-6 bg-surface-container-low rounded-[32px] gap-6">
            <View className="flex-row justify-between items-end">
              <View className="gap-1">
                <Text className="font-title-lg text-on-surface">Consistency Vine</Text>
                <Text className="font-label-md text-on-surface-variant">14 Days of mindfulness</Text>
              </View>
              <View className="items-end">
                <Text className="font-display text-headline-lg text-primary">82%</Text>
                <Text className="text-caption text-outline">Completion Rate</Text>
              </View>
            </View>
            <View className="relative h-16 flex-row items-center justify-between px-1">
              {VINE_DOTS.map((dot, i) => (
                <View
                  key={i}
                  className={`${dot.color} rounded-full`}
                  style={{ width: dot.size, height: dot.size }}
                />
              ))}
            </View>
          </View>

          {/* Monthly Highlights */}
          <View className="gap-4">
            <View className="flex-row justify-between items-center">
              <Text className="font-title-lg text-on-surface">Monthly Highlights</Text>
              <Pressable>
                <Text className="text-primary font-label-md">View All</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
              {HIGHLIGHTS.map((book) => (
                <View key={book.title} className="w-32">
                  <View className="aspect-[2/3] rounded-xl overflow-hidden bg-surface-variant">
                    <Image source={{ uri: book.img }} className="w-full h-full" resizeMode="cover" />
                  </View>
                  <Text className="mt-3 font-label-md text-on-surface" numberOfLines={1}>
                    {book.title}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Evolving Tastes */}
          <View className="gap-6 items-center">
            <View className="gap-3 w-full">
              <Text className="font-title-lg text-on-surface">Evolving Tastes</Text>
              <Text className="font-body-md text-on-surface-variant">
                You've transitioned from high-tempo <Text className="font-semibold">Mystery</Text> to deeper,
                reflective <Text className="font-semibold">Philosophy</Text> this season.
              </Text>
              <View className="flex-row flex-wrap gap-2">
                <View className="px-4 py-1.5 rounded-full bg-secondary/10">
                  <Text className="text-secondary font-label-md">Mystery</Text>
                </View>
                <View className="px-4 py-1.5 rounded-full bg-primary/10">
                  <Text className="text-primary font-label-md">Philosophy</Text>
                </View>
              </View>
            </View>
            <View className="items-center py-8">
              <Text className="font-display text-display text-primary leading-none">64%</Text>
              <Text className="font-label-md text-on-surface-variant">Pivot to Non-Fiction</Text>
            </View>
          </View>

          {/* Personal Reflections */}
          <View className="gap-4">
            <Text className="font-title-lg text-on-surface">Personal Reflections</Text>
            <View className="gap-4">
              <ReflectionCard
                icon="auto_awesome"
                iconBg="bg-primary-fixed"
                iconColor="#52634c"
                text='"You tend to finish mystery books during weekend evenings. Consider pairing non-fiction with shorter weekday sessions to maintain your momentum."'
              />
              <ReflectionCard
                icon="lightbulb"
                iconBg="bg-secondary-fixed"
                iconColor="#7d562d"
                text='"Your reading speed peaks at 11:00 PM. Have you considered a warmer light setting to help your eyes rest during late-night chapters?"'
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function ReflectionCard({
  icon,
  iconBg,
  iconColor,
  text,
}: {
  icon: IconName;
  iconBg: string;
  iconColor: string;
  text: string;
}) {
  return (
    <View className="p-6 bg-surface-container rounded-2xl flex-row gap-4 items-start">
      <View className={`w-10 h-10 rounded-full ${iconBg} items-center justify-center shrink-0`}>
        <Icon name={icon} size={18} color={iconColor} />
      </View>
      <Text className="flex-1 font-body-md text-on-surface leading-relaxed">{text}</Text>
    </View>
  );
}
