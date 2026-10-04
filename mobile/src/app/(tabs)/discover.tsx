import Feather from "@expo/vector-icons/Feather";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import Animated, { FadeIn, FadeInRight, FadeOutLeft } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDiscover } from "~/api/catalog";
import { Button } from "~/components/button";
import { ProductFeed } from "~/components/product-feed";
import { FeedSkeleton } from "~/components/skeleton";
import { EmptyState, ErrorState } from "~/components/states";
import { Body, Display, Eyebrow } from "~/components/typography";
import { imageUrl, pluralize } from "~/lib/format";
import { useTabBarInset } from "~/lib/layout";
import { moods, scentProfiles } from "~/shared";
import { fonts, gutter, makeStyles, onImage, scrims, useColors } from "~/theme";

const GAP = 12;
const toggle = (list: string[], value: string) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

/**
 * The website's scent finder (/discovery) as a guided flow: what draws you in, when you'll wear
 * it, then your matches as a lookbook. The same matching runs on the server.
 */
export default function DiscoverScreen() {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [scents, setScents] = useState<string[]>([]);
  const [moments, setMoments] = useState<string[]>([]);
  const restart = () => {
    setScents([]);
    setMoments([]);
    setStep(0);
  };

  if (step === 2) return <Matches scents={scents} moments={moments} onBack={() => setStep(1)} onRestart={restart} />;

  return (
    <Question
      key={step}
      step={step}
      title={step === 0 ? "What draws you in?" : "When will you wear it?"}
      hint={step === 0 ? "Choose as many as feel like you." : "Pick a moment or two, or skip."}
      canContinue={step === 0 ? scents.length > 0 : true}
      continueLabel={step === 0 ? "Next" : moments.length ? "See my matches" : "Skip, show matches"}
      onBack={step === 1 ? () => setStep(0) : undefined}
      onContinue={() => setStep(step === 0 ? 1 : 2)}
    >
      {step === 0 ? (
        <CharacterTiles selected={scents} onToggle={(slug) => setScents((list) => toggle(list, slug))} />
      ) : (
        <MomentTiles selected={moments} onToggle={(slug) => setMoments((list) => toggle(list, slug))} />
      )}
    </Question>
  );
}

function Question({
  step,
  title,
  hint,
  canContinue,
  continueLabel,
  onBack,
  onContinue,
  children,
}: {
  step: number;
  title: string;
  hint: string;
  canContinue: boolean;
  continueLabel: string;
  onBack?: () => void;
  onContinue: () => void;
  children: React.ReactNode;
}) {
  const styles = useStyles();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const bottom = useTabBarInset();
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: bottom + 110 }}>
        <View style={styles.padded}>
          <View style={styles.progress} accessibilityLabel={`Step ${step + 1} of 3`} accessible>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.segment, i <= step && styles.segmentOn]} />
            ))}
          </View>
          <Eyebrow style={{ marginTop: 20 }}>The scent finder · {step + 1} of 3</Eyebrow>
          <Animated.View entering={FadeInRight.duration(380)} exiting={FadeOutLeft.duration(200)}>
            <Display size={44} style={{ marginTop: 8 }}>
              {title}
            </Display>
            <Body muted style={{ marginTop: 8 }}>
              {hint}
            </Body>
          </Animated.View>
        </View>
        <Animated.View entering={FadeInRight.delay(80).duration(420)} style={{ marginTop: 24 }}>
          {children}
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottom + 12 }]}>
        {onBack && (
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} hitSlop={8} style={styles.backButton}>
            <Feather name="arrow-left" size={20} color={c.ink} />
          </Pressable>
        )}
        <Button label={continueLabel} disabled={!canContinue} onPress={onContinue} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

function CharacterTiles({ selected, onToggle }: { selected: string[]; onToggle: (slug: string) => void }) {
  const styles = useStyles();
  const c = useColors();
  const { width } = useWindowDimensions();
  const tile = (width - gutter * 2 - GAP) / 2;
  return (
    <View style={[styles.padded, styles.grid]}>
      {scentProfiles.map((profile) => {
        const on = selected.includes(profile.slug);
        return (
          <Pressable
            key={profile.slug}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            accessibilityLabel={`${profile.label}: ${profile.description}`}
            onPress={() => {
              void Haptics.selectionAsync();
              onToggle(profile.slug);
            }}
            style={({ pressed }) => [styles.tile, { width: tile }, on && styles.tileOn, pressed && { transform: [{ scale: 0.97 }] }]}
          >
            {on && <Feather name="check" size={16} color={c.ivory} style={styles.check} />}
            <Text style={[styles.tileTitle, on && { color: c.ivory }]}>{profile.label}</Text>
            <Text style={[styles.tileText, on && { color: c.sand }]}>{profile.description}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function MomentTiles({ selected, onToggle }: { selected: string[]; onToggle: (slug: string) => void }) {
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const tile = (width - gutter * 2 - GAP) / 2;
  return (
    <View style={[styles.padded, styles.grid]}>
      {moods.map((mood) => {
        const on = selected.includes(mood.slug);
        return (
          <Pressable
            key={mood.slug}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            accessibilityLabel={`${mood.label}: ${mood.description}`}
            onPress={() => {
              void Haptics.selectionAsync();
              onToggle(mood.slug);
            }}
            style={({ pressed }) => [styles.moment, { width: tile, height: tile * 1.25 }, on && styles.momentOn, pressed && { transform: [{ scale: 0.97 }] }]}
          >
            <Image source={imageUrl(mood.image)} style={styles.fill} contentFit="cover" transition={250} />
            <LinearGradient colors={scrims.tile.colors} locations={scrims.tile.locations} style={styles.fill} />
            {on && (
              <View style={styles.momentCheck}>
                <Feather name="check" size={16} color={onImage.night} />
              </View>
            )}
            <Text style={styles.momentTitle}>{mood.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Matches({ scents, moments, onBack, onRestart }: { scents: string[]; moments: string[]; onBack: () => void; onRestart: () => void }) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const bottom = useTabBarInset();
  const results = useDiscover(scents, moments);

  if (results.isPending) return <FeedSkeleton />;
  if (results.isError) return <ErrorState message={results.error.message} onRetry={results.refetch} />;
  if (results.data.results.length === 0) {
    return (
      <View style={styles.screen}>
        <EmptyState title="No exact match" message="Try fewer choices: every NOIRÉ fragrance has a few characters and moments." />
        <View style={[styles.padded, { paddingBottom: bottom + 16 }]}>
          <Button label="Change my answers" variant="secondary" onPress={onBack} />
        </View>
      </View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(400)} style={{ flex: 1 }}>
      <ProductFeed
        products={results.data.results}
        bottomInset={bottom}
        overlay={
          <View style={[styles.matchBar, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
            <Pressable accessibilityRole="button" accessibilityLabel="Change my answers" onPress={onBack} hitSlop={8} style={styles.round}>
              <Feather name="sliders" size={18} color={onImage.cream} />
            </Pressable>
            <Text style={styles.matchTitle}>{pluralize(results.data.results.length, "match", "matches")} for you</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Start again" onPress={onRestart} hitSlop={8} style={styles.round}>
              <Feather name="rotate-ccw" size={18} color={onImage.cream} />
            </Pressable>
          </View>
        }
      />
    </Animated.View>
  );
}

const useStyles = makeStyles((c) => ({
  screen: { flex: 1, backgroundColor: c.ivory },
  padded: { paddingHorizontal: gutter },
  fill: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  progress: { flexDirection: "row", gap: 6 },
  segment: { flex: 1, height: 3, borderRadius: 2, backgroundColor: c.sand },
  segmentOn: { backgroundColor: c.ink },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
  tile: { minHeight: 104, padding: 16, borderRadius: 20, justifyContent: "flex-end", backgroundColor: c.stone },
  tileOn: { backgroundColor: c.ink },
  check: { position: "absolute", top: 14, right: 14 },
  tileTitle: { fontFamily: fonts.serif, fontSize: 26, color: c.ink },
  tileText: { fontFamily: fonts.sans, fontSize: 12, color: c.muted, marginTop: 2 },
  moment: { borderRadius: 20, overflow: "hidden", justifyContent: "flex-end", padding: 14, backgroundColor: c.stone, borderWidth: 2, borderColor: "transparent" },
  momentOn: { borderColor: c.ink },
  momentCheck: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: onImage.cream,
  },
  momentTitle: { fontFamily: fonts.serif, fontSize: 24, color: onImage.cream },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: 10,
    paddingTop: 12,
    paddingHorizontal: gutter,
    backgroundColor: c.ivory,
  },
  backButton: { width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: c.line },
  matchBar: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: gutter },
  matchTitle: { flex: 1, textAlign: "center", fontFamily: fonts.serif, fontSize: 22, color: onImage.cream },
  round: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(26,25,24,0.35)",
    borderWidth: 1,
    borderColor: "rgba(247,243,237,0.35)",
  },
}));
