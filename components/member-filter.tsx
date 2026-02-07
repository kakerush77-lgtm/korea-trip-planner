import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { MemberId, Member } from "@/data/types";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

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
    <View style={[styles.wrapper, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* All checkbox */}
        <Pressable
          onPress={onSelectAll}
          style={({ pressed }) => [
            styles.chip,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && { opacity: 0.7 },
          ]}
        >
          <View style={[styles.checkbox, { borderColor: colors.border }]}>
            {isAllSelected && (
              <MaterialIcons name="check" size={16} color={colors.primary} />
            )}
          </View>
          <Text style={styles.chipEmoji}>{everyoneMember?.emoji ?? "🌈"}</Text>
          <Text style={[styles.chipText, { color: colors.foreground }]}>全員</Text>
        </Pressable>

        {/* Individual members with checkboxes */}
        {individualMembers.map((member) => {
          const isSelected = selectedMembers.includes(member.id);
          return (
            <Pressable
              key={member.id}
              onPress={() => onToggleMember(member.id)}
              style={({ pressed }) => [
                styles.chip,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && { opacity: 0.7 },
              ]}
            >
              <View style={[styles.checkbox, { borderColor: colors.border }]}>
                {isSelected && (
                  <MaterialIcons name="check" size={16} color={colors.primary} />
                )}
              </View>
              <Text style={styles.chipEmoji}>{member.emoji}</Text>
              <Text style={[styles.chipText, { color: colors.foreground }]}>
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
    paddingVertical: 10,
  },
  container: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  chipEmoji: {
    fontSize: 15,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
