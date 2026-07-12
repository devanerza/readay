import React from "react";
import { View, Text, ScrollView, Image, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "../../components/Icon";

const RECENTLY_FINISHED = [
  {
    title: "Normal People",
    author: "Sally Rooney",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCR3TtQASVtyjoJdg7NnPYSzKaUj86r7NIJXDQg0klbLeMjFUm2miOxAKc-SXA43qL563r-dGqX787gTSQc8pKCqLAAUUcOtGMe1jOLFNc5hIwL2hkJKFbpodyy4-cQCbUC0gtAD4q0ETBwp5WHf07JJMZdCa4TKXh9He4zBBRItuB8RWAmBFutfVMtsu0NXCsn6Jd1WJWpAShNO1C_v3cXbEU7uev40HinVcV-1_OvuhHYIys_tB2uqw",
  },
  {
    title: "Pride and Prejudice",
    author: "Jane Austen",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuB41A1Pmd9a9azgThtDTSH0hU2_a_9X9K-x0UnnR8WxyDCt6MZpXiYygRDzNWgDs3ksjfQGSgh30SF0bxDQAU5L_TyTDoaoovelhJ3C7zPB3BiXwdKB9NGOt3yKR9y_E3243f2M_Pk7mAajjGbhq2hIXVrwzmlKjIYERkqEdX2S6gjv4T6dx72TJ_0tmijMT1Wkv6TKgUGCbqPzsbh942-Tx34ZmqmLOczM4HdBMqntIYG7UgbrsQ9K2A",
  },
  {
    title: "Dune",
    author: "Frank Herbert",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuC1ycAz7wkbBkDvF6z0VnqXYt3l09HK83D1BJjEkhYxaXZORS560nkW0rLivq0HpLSc8SiAqy17V1dUFZFcsW2dSjBGHrCj6DswuExLnfYHtagNV35HOUsd8GfEyLuro3nuLIlfBQyb4wuLC0a9J6HHbk_KSojmpsRyu3xjpuqrftImQtT3j4mVzs3xM406S0SY-bxEDzHLFoX3D-QhLfpeeivhZDlHVswg_Ct5G53WUsrdRNX5ybk4EA",
  },
  {
    title: "Steve Jobs",
    author: "Walter Isaacson",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBw28iw7Hypb-0veIzLzUsr0DyDnbRlcouENMfcRBpcQb1vrDcPBW1GvrXOOCREYbcG4MqpxPE5SEVTXkQCWWJbmQUbTH86y2buWg2syU0LcqvoJDOG42Yc3tOnPhpSRs7w-X4xovQuQ0t6ITkoLbbArdsCdM7DYTiRzoG_PV0a7sjAhoIWHTmmOWCdqjNhBlfWWpgWwlnwnJ1FOKT1xnEv8zSzGwHgzE4fFepx1MJT_l1V4PesGkkBAw",
  },
  {
    title: "Circe",
    author: "Madeline Miller",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDr0TKjXdNQJ6NesdEHlJb_r9N9ZksDeVnk4M7TXKBmNbRENntuLy4BSpIoo98FA9j7esDb8GWNGSBdx6PS-1F_rIQLMmnzJJHQNjcn4_eFHrqiwHf1mHC5s0VQQBqyiiHEWbVwf2i3tTdDBwgxt4dWinvo1vqJxvSDLmvuWqfvcHirRq5Dmhg6qv5O9NhqSL5Nv3PtV0ZEW5nANrtZpBo_yJcXpx2sYEQ978zK_LyXbNjPfQLQ0sMm5w",
  },
];

const AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCwWHPrUolpz3YG4PttK_Fq49K5Z_B--DrQ2yGMMYjyeLrLaFSZNTTZDkIulrptthRkdRlzGMrfyCJWq2N_Po9WTluz0WOfU1_ImLYhY5_23LR1iDKSbAti0-a3fLoxDqUv8T-AcW-PuNESaRqx57KAMgfYCDu9hH1EhuyGLH2sKaCFdTRJ58lFQWrbPVW05bnHqzTB6yPUdij7yC2zf8-dZdhC6hY2DIz6-G9w-9kfWjEu6gh1uYyy7A";

const GATSBY_COVER =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBtNodAzW9ZHviWTp7Ts0vfEQ60vdibF7uoiHXguytZKKDVB-cycqV-hfMR5yxQeFn_JM66tzoLIY92EXJ4aiomRVsNvSZZhKP018q6ZSPN--kjig8WqaclN27sIGF4_-LZktnYaG74HMnx9ZGyB0m_4X_upaxLdFC4m9S3ySt9BaSEirQSs3EcsI7jg2jgjjYVwLtpfm2VapUB8zgJv5Jxffeasns1-o6uuYBI0jOLpHGs6D6ZzXjVsA";

const SILENT_PATIENT_COVER =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAm-6FEyP4oxg7sLHX7q6p5toMM278A1xO3-LRQnR5iiF93Zl2KamA8svOA3vN-RvcbF6u7jobre0fdTt-TuUIIY0MRgz2XgZmC7vFP1I2Idi9V71X-w33Y4FBAV82Xsz05Rj7Onlqk-s4LBfomAM9vctmolPBlOduHVXSTA_ievTZtIfLhYcHxufsICM2DG5S0xuT3NePJHrtBZnpqW6G5PdMGz2cXT3Jun21AFCYBhzs2OswizVVgHg";

export default function Home() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView edges={["top"]} className="flex-1">
        {/* Top Navigation Bar */}
        <View className="w-full flex-row justify-between items-center px-margin-page py-4">
          <View className="flex-row items-center gap-4">
            <Pressable className="active:opacity-70">
              <Icon name="menu" color="#52634c" />
            </Pressable>
            <Text className="font-display text-headline-md text-primary ml-4">ReadFlow</Text>
          </View>
          <View className="flex-row items-center gap-4">
            <Pressable className="active:opacity-70 mr-4">
              <Icon name="search" color="#444841" />
            </Pressable>
            <View className="w-8 h-8 rounded-full overflow-hidden border border-primary-container/10 bg-primary-container/20">
              <Image source={{ uri: AVATAR }} className="w-full h-full" resizeMode="cover" />
            </View>
          </View>
        </View>

        <ScrollView
          className="flex-1 px-margin-page"
          contentContainerStyle={{ paddingBottom: 120, gap: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Friendly Greeting */}
          <View className="mt-2">
            <Text className="font-display text-[40px] leading-[46px] text-on-surface">
              Good Evening, <Text className="italic font-normal">Sarah</Text>
            </Text>
            <Text className="text-on-surface-variant mt-2 font-body-lg">
              The perfect time to lose yourself in a story. You've read for 12 days straight.
            </Text>
          </View>

          {/* Hero: Continue Reading */}
          <View className="rounded-[24px] bg-surface-container overflow-hidden">
            <View className="w-full h-48 overflow-hidden">
              <Image source={{ uri: GATSBY_COVER }} className="w-full h-full" resizeMode="cover" />
            </View>
            <View className="p-6 gap-4">
              <View className="gap-1">
                <Text className="text-primary font-label-md uppercase tracking-widest">Currently Reading</Text>
                <Text className="font-headline-lg text-on-surface">The Great Gatsby</Text>
                <Text className="text-on-surface-variant italic">F. Scott Fitzgerald</Text>
              </View>
              <View className="gap-1 w-full max-w-xs">
                <View className="flex-row justify-between items-end mb-1">
                  <Text className="text-on-surface-variant font-label-md">Progress</Text>
                  <Text className="text-primary font-label-md">65%</Text>
                </View>
                <View className="h-1.5 w-full bg-primary-container/10 rounded-full overflow-hidden">
                  <View className="h-full bg-primary rounded-full" style={{ width: "65%" }} />
                </View>
              </View>
              <Pressable
                onPress={() => router.push("/book-detail")}
                className="self-start bg-primary px-8 py-3.5 rounded-full active:scale-95 flex-row items-center gap-3"
              >
                <Text className="text-white font-label-md">Resume Reading</Text>
                <Icon name="play_arrow" size={18} color="#ffffff" filled />
              </Pressable>
            </View>
          </View>

          {/* Today's Pick */}
          <View className="bg-surface-container-low rounded-[24px] p-6 gap-6">
            <View className="flex-row gap-6 items-start">
              <View className="w-24 shrink-0 rounded-lg overflow-hidden" style={{ transform: [{ rotate: "-2deg" }] }}>
                <Image
                  source={{ uri: SILENT_PATIENT_COVER }}
                  className="w-full aspect-[2/3]"
                  resizeMode="cover"
                />
              </View>
              <View className="flex-1 gap-2">
                <View className="flex-row items-center gap-2">
                  <Icon name="auto_awesome" size={16} color="#7d562d" filled />
                  <Text className="text-secondary font-label-md">TODAY'S PICK</Text>
                </View>
                <Text className="font-headline-md text-on-surface text-xl">The Silent Patient</Text>
                <Text className="text-on-surface-variant font-body-md leading-relaxed">
                  Because you loved mystery novels like <Text className="italic">Gone Girl</Text>, we think
                  you'll enjoy this atmospheric thriller.
                </Text>
                <Pressable className="flex-row items-center gap-2 pt-2">
                  <Text className="text-primary font-label-md">Add to Library</Text>
                  <Icon name="arrow_forward" size={16} color="#52634c" />
                </Pressable>
              </View>
            </View>
          </View>

          {/* Upcoming Session */}
          <View className="bg-primary-container/20 border border-primary-container/20 rounded-[24px] p-6 gap-6">
            <View className="gap-3">
              <View className="p-3 bg-white/50 rounded-2xl self-start">
                <Icon name="schedule" size={26} color="#52634c" />
              </View>
              <View className="gap-1">
                <Text className="font-title-lg text-on-surface">Evening Ritual</Text>
                <Text className="text-on-surface-variant text-sm font-body-md">
                  Your scheduled 20-minute focus session starts soon.
                </Text>
              </View>
            </View>
            <View className="w-full gap-4">
              <View className="flex-row justify-between items-center">
                <Text className="text-on-surface-variant font-label-md">Starts in</Text>
                <Text className="text-primary font-label-md font-bold">14:00</Text>
              </View>
              <Pressable
                onPress={() => router.push("/reading-session")}
                className="w-full bg-white border border-primary-container/30 py-3 rounded-full items-center active:bg-primary"
              >
                <Text className="text-primary font-label-md">Remind Me</Text>
              </Pressable>
            </View>
          </View>

          {/* Recently Finished */}
          <View className="gap-4">
            <View className="flex-row justify-between items-end">
              <Text className="font-headline-md text-on-surface">Recently Finished</Text>
              <Pressable className="flex-row items-center gap-1">
                <Text className="text-on-surface-variant font-label-md">See All</Text>
                <Icon name="chevron_right" size={16} color="#444841" />
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
              {RECENTLY_FINISHED.map((book) => (
                <Pressable key={book.title} className="w-[140px]" onPress={() => router.push("/book-detail")}>
                  <View className="aspect-[2/3] rounded-xl overflow-hidden mb-3">
                    <Image source={{ uri: book.img }} className="w-full h-full" resizeMode="cover" />
                  </View>
                  <Text className="font-label-md text-on-surface" numberOfLines={1}>
                    {book.title}
                  </Text>
                  <Text className="text-caption text-on-surface-variant">{book.author}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
