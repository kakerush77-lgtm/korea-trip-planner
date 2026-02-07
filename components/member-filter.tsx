import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { MemberId, Member } from "@/data/types";
import { useColors } from "@/hooks/use-colors";

export interface MemberFilterProps {
  selectedMembers: MemberId[];
  onToggleMember: (memberId: MemberId) => void;
  onSelectAll: () => void;
  members: Member[];
}

export function MemberFilter({
  selectedMembers,
  onToggleMember,
  onSelectAll,
  members,
}: MemberFilterProps) {
  const colors = useColors();
  const isAllSelected = selectedMembers.length === 0;

  // Separate "everyone" from individual members
  const everyoneMember = members.find((m) => m.id === "everyone");
  const individualMembers = members.filter((m) => m.id !== "everyone");

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* All button */}
        <Pressable
          onPress={onSelectAll}
          style={({ pressed }) => [
            styles.chip,
            isAllSelected
              ? { backgroundColor: colors.primary }
              : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={styles.chipEmoji}>{everyoneMember?.emoji ?? "🌈"}</Text>
          <Text
            style={[
              styles.chipText,
              { color: isAllSelected ? "#FFFFFF" : colors.foreground },
            ]}
          >
            全員
          </Text>
        </Pressable>

        {/* Individual members */}
        {individualMembers.map((member) => {
          const isSelected = selectedMembers.includes(member.id);
          return (
            <Pressable
              key={member.id}
              onPress={() => onToggleMember(member.id)}
              style={({ pressed }) => [
                styles.chip,
                isSelected
                  ? { backgroundColor: member.color }
                  : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.chipEmoji}>{member.emoji}</Text>
              <Text
                style={[
                  styles.chipText,
                  { color: isSelected ? "#FFFFFF" : colors.foreground },
                ]}
              >
                {member.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 8,
  },
  container: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 4,
  },
  chipEmoji: {
    fontSize: 15,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
