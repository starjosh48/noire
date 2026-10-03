import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { useSearch } from "~/api/catalog";
import { EmptyState, ErrorState, LoadingState } from "~/components/states";
import { formatPrice, imageUrl } from "~/lib/format";
import { familyLine } from "~/shared";
import { fonts, gutter, makeStyles, useColors } from "~/theme";

export default function SearchScreen() {
  const styles = useStyles();
  const colors = useColors();
  const [text, setText] = useState("");
  const [term, setTerm] = useState("");

  // Search once typing pauses, not on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setTerm(text), 250);
    return () => clearTimeout(timer);
  }, [text]);

  const search = useSearch(term);
  const ready = term.trim().length >= 2;

  return (
    <View style={styles.screen}>
      <View style={styles.field}>
        <Feather name="search" size={18} color={colors.muted} />
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Fragrance, note or mood"
          placeholderTextColor={colors.faint}
          style={styles.input}
          returnKeyType="search"
          autoFocus
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
          accessibilityLabel="Search fragrances"
        />
      </View>

      <FlatList
        data={ready ? (search.data?.results ?? []) : []}
        keyExtractor={(p) => p.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => (
          <Link href={{ pathname: "/product/[slug]", params: { slug: item.slug } }} asChild>
            <Pressable style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.stone }]}>
              <Image source={imageUrl(item.image_url)} style={styles.thumb} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.family}>{familyLine(item.fragrance_family, item.secondary_family)}</Text>
                <Text style={styles.price}>From {formatPrice(item.price, item.currency)}</Text>
              </View>
            </Pressable>
          </Link>
        )}
        ListEmptyComponent={
          !ready ? (
            <EmptyState title="What are you in the mood for?" message="Try “iris”, “smoky” or “after dark”." />
          ) : search.isPending ? (
            <LoadingState />
          ) : search.isError ? (
            <ErrorState message={search.error.message} onRetry={search.refetch} />
          ) : (
            <EmptyState title="No matches" message={`Nothing found for “${term.trim()}”. Try a note or a mood.`} />
          )
        }
      />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.ivory },
  padded: { paddingHorizontal: gutter },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: gutter,
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 999,
    backgroundColor: colors.stone,
  },
  input: { flex: 1, fontFamily: fonts.sans, fontSize: 16, color: colors.ink },
  row: { flexDirection: "row", gap: 16, alignItems: "center", paddingHorizontal: gutter, paddingVertical: 12 },
  thumb: { width: 64, height: 80, borderRadius: 12, backgroundColor: colors.stone },
  name: { fontFamily: fonts.serif, fontSize: 21, color: colors.ink },
  family: {
    fontFamily: fonts.sans,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: colors.faint,
    marginTop: 3,
  },
  price: { fontFamily: fonts.sans, fontSize: 13, color: colors.ink, marginTop: 6 },
}));
