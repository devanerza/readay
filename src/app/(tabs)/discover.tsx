import React from "react";
import { View, Text, TextInput, ScrollView, Image, Pressable, ImageBackground } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import Icon from "../../components/Icon";

type SearchForm = { query: string };

const GENRES = [
  { label: "All Curated", active: true },
  { label: "Mystery" },
  { label: "Sci-Fi" },
  { label: "Memoirs" },
  { label: "Classics" },
  { label: "Poetry" },
];

const MATCHED_BOOKS = [
  {
    title: "Project Hail Mary",
    author: "Andy Weir",
    match: 85,
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBdUdHBU8PnhqUqAhjwp73_8C1n2zm5aEqKAPKOmQr9UsqnDT2KSrVLb956D4qAngmgldVhANdaxN7NtMOxyOxwu8mdvm9yHsYzwKezV5IvKYHx1IrI4nZHpLUO1EFUk5ut6s3pW_99wbbhlIherorK7afkBDSO0MofGNVd55iz24f-YPL8ARISrWBYeboFvW9Kg-c-B2zeliWqJXahf76Npfq3U8PagvalS6Xm9Rmh9XNnRvzKukCvXg",
  },
  {
    title: "The Secret History",
    author: "Donna Tartt",
    match: 92,
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBNEWwiqv8glBF8lWAbRKaqQgc2sh8wnVab7zXot2Uu9OJFZ_P184CyX4c9Byx_lSjfsC59xaFmBR_bmTnfVzVE5Tgdke901OuJ89Ms0k83mHD2G9pbAWv7Ekzyii90gcxpFPs58GQ5c0bHx-N7hZ_I5R9ywIQF4p-iloJMNWH0vJb32Hyn_AEQ8JqUGRf2yoK-aZrNi4Xukg1ZEAigqurF_yYWUfSH9KQv080xIfUlj-YE5uVkAX_OfQ",
  },
  {
    title: "Normal People",
    author: "Sally Rooney",
    match: 78,
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDGftAgLaAovCnVL1gTFQDsm8C01TV7LK3AVljVi48jyB0XPDyYnARM4j8dYJLnnzeiOodiaL60dodWnZ_AeOPmYSYHfAsDDwYCgTK3DVLYXbiOWSxls5MeMaP2Uq3YyntEaEaqpzQQjMNJoKNPq5hR5yyMcPJQD1C4wz4RXonvqb76my4p0_SHVlDN0_8F8t583mzwwQqAvfn1Kp3ERIqTMz1xCFe3XsCLmNRObUO4yjr02QH3B_R-nA",
  },
  {
    title: "The Night Circus",
    author: "Erin Morgenstern",
    match: 88,
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuD8Vnc5bzba9hIeX2HNux6vP7g2U70zDOUhq27gT-Y6mEtPW39z0hDweyAJo7MP6vUkBqr_76QeoUn6-OfrOKEjris3jkL1sx_Y8s-zS79Gzbi80HURNnBjGOmKryqIZbKI7nLQYuBI4i9gXfAck6KkXMJw6TLDAT9lsMb1A1twsEcGnaRtXJShvr9wJZuhQJZDFOFANFAGrZXtAb2CzpltKYluq3vaIMkAXE-OLXYXiGYp-Nr3HvBbrQ",
  },
];

const TRENDING = [
  { title: "The Silent Patient", author: "Alex Michaelides", rating: "4.8 ★ (1.2k)", tag: "Trending" },
  { title: "The Guest List", author: "Lucy Foley", rating: "4.5 ★ (940)", tag: "Hot" },
  { title: "The Woman in the Window", author: "A.J. Finn", rating: "4.2 ★ (2.1k)", tag: "Viral" },
];

const TRENDING_IMG = {
  "The Silent Patient":
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAG_-RORcdSykqLS7NPsXfGjN3HWymCNgt3lJFeo0lnz-3vnC0Ax7nfKJsYc5gsNWUAUYdyTKekPkBecLhZANkCJGhU7dHp6pufVeDKB-kF8R1fhBjsk87c3QocoTGn_ub1driOnimighOFrNO12WEYIb-sHG5f5m7ufwxSRGLqSpp6hm7wOMsRKAIVm9Qm9zVsQDGohUw_TTvTpuWqcNmIykGquADJvmM9wIlqpszBd2waGZ0DxnS7gg",
  "The Guest List":
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBkVmzjA1i4G5prr5Y-WfNt1zu_M5L77hZ7GEqO3iDxhiGpBgk7iM27OLeJKBTD2kXdH1zZW0Hp_xKSFWDPQ8mCzRPdTsULqfRY2JIM3vSStwQlzWiCjqnFlA5G00Nsk_Fe5r9UUr7Z8dE-Yp_hIptcLa_BhXEu4hxn9F0mDNE2GN4-hYtmYc4gZOFMk0S4fSS2sVtsBAlEa7k5f6XIAYfIi_7lnP2Oa-11FRAb1Cgp_19OMO_09eHOyw",
  "The Woman in the Window":
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAT95vwwhTy3HqviV_rGy5ogLEO9k2F4PpG6S_Bx4CDeGj1NrgBP0Vb1xtoHVbzw9_CK0a5NXfKcedy_qR_hB3s9bqRIS4u-eSGKVWvTtPCF79qgTeBHLGFX8nx43fv4TZtQwtE191JmAUo9Veia4_mOACWJ_tkrxOUdR7Je83KV6c5XZCVVBH8a5Zq1_gVHLGXxErX3WAt18gGaVzkrFpV7WTT2SJJzbVdZ1p3vAgyRBxKZTICWZ30Xg",
};

const AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDwK4X7VHY5GgwBRu4O5y49Fv2LwtFpX3_Lb7Xh77W0IjDV3XSXWKkYi3QJZqajtBAShgPv1TU4LBEuonL8LaYt3hGAsaNlVU0I32otBJ82_Py_2WyoMDirz9vSy2mLPTjRCagnA61DOk6XYA0oSFs9DZJcP-oaB22b35kHlEa6BTTbP1Yx8TAoak40FVsEGVEkZfxqzS7ITGo-lx2U9JggSIbrgdyKEaXBBdCU3QkCt7ItDAAM14a9JA";

const MIDNIGHT_LIBRARY_BG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC2DsWbZMndqCJyPOBejcPYiRt8M0MrQRiuX157d1f1DL3DNNKB-3-mV-VdZSHULTMr7BcM5voThVSr0gjeOpL9jZ91qSIp2pxET--xmzdxOReEePdJKB_KprcgaMpipPkHQp8nlOD3G9A5xdSHgBff0L2iOdeo1kiyksZwmDZgA95BrpTTPfLXxpHetzvE2lsQ6V63gsEi9LIzCihcEmIxljuB_9NXKGD4FIul0aG5ZJX_GmiZZFSeCA";

const CIRCE_BG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAVAEUJKM7kSSeMwhql5tF7oYKFRGO3a8MUMq5cSJB7wlFucMXOtMRIKk0VL_Dd_abkvYRFGqk3fVGqvF97lDeGNNczMuPkpnBfnWYiKhvB7UVDFUsPkDZOdOloRXWEbsvWxMD1-74GjI0PHsaelkAJPGVi-gf7Du6Dde6mgFRPsb3_p77lanGeDhsgvOD3L5CBXpNrR5p-7qRs7BAsHwCgkIMw4zUuXjscA-zyRNlGAVRnSyXoOUI2Dw";

export default function Discover() {
  const router = useRouter();
  const { control, handleSubmit } = useForm<SearchForm>({ defaultValues: { query: "" } });
  const [activeGenre, setActiveGenre] = React.useState("All Curated");

  const onSearch = (data: SearchForm) => {
    // Wire this up to your real search / filtering logic
    console.log("Searching for:", data.query);
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView edges={["top"]} className="flex-1">
        {/* Top Nav */}
        <View className="w-full flex-row justify-between items-center px-margin-page py-4">
          <View className="flex-row items-center gap-4">
            <Icon name="menu" color="#52634c" />
            <Text className="font-display text-headline-md text-primary ml-4">ReadFlow</Text>
          </View>
          <View className="w-9 h-9 rounded-full overflow-hidden bg-primary-container/20">
            <Image source={{ uri: AVATAR }} className="w-full h-full" resizeMode="cover" />
          </View>
        </View>

        <ScrollView
          className="flex-1 px-margin-page"
          contentContainerStyle={{ paddingBottom: 120, gap: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Search Bar (react-hook-form) */}
          <View className="mt-2">
            <Controller
              control={control}
              name="query"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="bg-surface-container-low px-4 py-3 rounded-xl flex-row items-center gap-3">
                  <Icon name="search" size={20} color="#747870" />
                  <View className="flex-1">
                    <TextInputWrapper
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      onSubmitEditing={handleSubmit(onSearch)}
                      placeholder="Search curated titles..."
                    />
                  </View>
                </View>
              )}
            />
          </View>

          {/* Genre Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {GENRES.map((g) => {
              const active = activeGenre === g.label;
              return (
                <Pressable
                  key={g.label}
                  onPress={() => setActiveGenre(g.label)}
                  className={
                    active
                      ? "px-6 py-2 rounded-full bg-primary"
                      : "px-6 py-2 rounded-full bg-surface-variant"
                  }
                >
                  <Text className={active ? "font-label-md text-on-primary" : "font-label-md text-on-surface-variant"}>
                    {g.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Perfect for Tonight */}
          <View className="gap-4">
            <View className="flex-row items-baseline justify-between">
              <Text className="font-headline-lg-mobile text-on-surface">Perfect for Tonight</Text>
              <Text className="text-primary font-label-md">Explore Collection</Text>
            </View>

            <View className="gap-4">
              <FeatureCard
                bg={MIDNIGHT_LIBRARY_BG}
                tag="Staff Pick"
                tagColor="bg-primary/90"
                title="The Midnight Library"
                author="by Matt Haig"
                why="A comforting exploration of regret and the infinite possibilities of life."
                onPress={() => router.push("/book-detail")}
              />
              <FeatureCard
                bg={CIRCE_BG}
                tag="Must Read"
                tagColor="bg-secondary/90"
                title="Circe"
                author="by Madeline Miller"
                why="Masterful prose that reimagines mythology with a modern, lyrical heart."
                onPress={() => router.push("/book-detail")}
              />
            </View>
          </View>

          {/* Based on Your Favorites */}
          <View className="gap-4">
            <Text className="font-headline-lg-mobile text-on-surface">Based on Your Favorites</Text>
            <View className="flex-row flex-wrap gap-x-4 gap-y-6">
              {MATCHED_BOOKS.map((book) => (
                <Pressable key={book.title} className="w-[45%]" onPress={() => router.push("/book-detail")}>
                  <View className="aspect-[2/3] w-full rounded-lg overflow-hidden">
                    <Image source={{ uri: book.img }} className="w-full h-full" resizeMode="cover" />
                  </View>
                  <View className="mt-2">
                    <Text className="font-title-lg text-on-surface" numberOfLines={1}>
                      {book.title}
                    </Text>
                    <Text className="text-caption text-outline">{book.author}</Text>
                    <View className="mt-2 flex-row items-center gap-2">
                      <View className="h-1 flex-1 bg-surface-container rounded-full overflow-hidden">
                        <View className="h-full bg-primary rounded-full" style={{ width: `${book.match}%` }} />
                      </View>
                      <Text className="text-[10px] font-label-md text-primary">{book.match}% Match</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Trending */}
          <View className="gap-4">
            <Text className="font-headline-lg-mobile text-on-surface">Trending Among Mystery Readers</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
              {TRENDING.map((book) => (
                <View key={book.title} className="w-[260px] bg-surface-container-high rounded-xl p-5 gap-4">
                  <View className="flex-row gap-4">
                    <View className="w-20 aspect-[2/3] rounded overflow-hidden shrink-0">
                      <Image
                        source={{ uri: (TRENDING_IMG as any)[book.title] }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    </View>
                    <View className="flex-1 justify-center">
                      <Text className="font-title-lg text-body-lg text-on-surface leading-tight">{book.title}</Text>
                      <Text className="text-caption text-on-surface-variant italic">{book.author}</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center justify-between pt-2 border-t border-outline-variant/30">
                    <Text className="text-caption text-outline">{book.rating}</Text>
                    <View className="bg-secondary-container/20 px-2 py-0.5 rounded">
                      <Text className="text-[10px] font-label-md text-secondary uppercase">{book.tag}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function FeatureCard({
  bg,
  tag,
  tagColor,
  title,
  author,
  why,
  onPress,
}: {
  bg: string;
  tag: string;
  tagColor: string;
  title: string;
  author: string;
  why: string;
  onPress: () => void;
}) {
  return (
    <View className="rounded-2xl overflow-hidden bg-surface-container-low">
      <ImageBackground source={{ uri: bg }} className="h-[340px] justify-end" resizeMode="cover">
        <View className="p-6">
          <View className={`${tagColor} self-start px-2 py-1 rounded-sm mb-3`}>
            <Text className="text-white text-[10px] uppercase tracking-widest font-label-md">{tag}</Text>
          </View>
          <Text className="font-display text-headline-lg text-white mb-1">{title}</Text>
          <Text className="font-body-md text-label-md text-white/90 italic">{author}</Text>
        </View>
      </ImageBackground>
      <View className="p-6 border-t border-surface-variant/20">
        <Text className="font-body-md text-on-surface-variant leading-relaxed">
          <Text className="font-semibold text-primary">Why: </Text>
          {why}
        </Text>
        <Pressable onPress={onPress} className="mt-4 py-3 bg-primary rounded-full flex-row items-center justify-center gap-2 active:scale-95">
          <Icon name="auto_stories" size={16} color="#ffffff" />
          <Text className="text-on-primary font-label-md">Start Journey</Text>
        </Pressable>
      </View>
    </View>
  );
}

function TextInputWrapper(props: any) {
  return (
    <TextInput
      {...props}
      className="font-label-md text-on-surface"
      placeholderTextColor="#747870"
    />
  );
}
