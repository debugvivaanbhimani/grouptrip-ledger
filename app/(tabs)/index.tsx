import { MaterialIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/screen-container";

type Tab = "plan" | "overview" | "ledger" | "settle" | "activity" | "profile";
type Booking = {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  category: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  participants: string[];
  status?: string;
};

const members = ["Aisha", "Rohan", "Priya", "Amit", "Neha"];
const initialBookings: Booking[] = [
  {
    id: "stay",
    title: "Hotel · 3 nights",
    subtitle: "The Fern Residency · 12–15 Sep",
    amount: 24000,
    category: "Stay",
    icon: "hotel",
    participants: ["Aisha", "Rohan", "Priya", "Amit"],
    status: "Confirmed",
  },
  {
    id: "raft",
    title: "White-water rafting",
    subtitle: "Dandeli Adventures · 13 Sep",
    amount: 8000,
    category: "Activity",
    icon: "kayaking",
    participants: ["Aisha", "Rohan", "Amit"],
    status: "Confirmed",
  },
  {
    id: "cab",
    title: "Airport cabs",
    subtitle: "Round trip · Booked by Amit",
    amount: 3600,
    category: "Transport",
    icon: "local-taxi",
    participants: ["Aisha", "Rohan", "Priya", "Amit", "Neha"],
    status: "Pending receipt",
  },
];

const colors = {
  ink: "#14233B",
  muted: "#6C7B91",
  faint: "#9AA7B8",
  blue: "#1769E0",
  blueSoft: "#E8F1FF",
  bg: "#F5F8FC",
  card: "#FFFFFF",
  line: "#E4EAF2",
  mint: "#E5F5EF",
  mintText: "#13815A",
  peach: "#FFF0E4",
  peachText: "#B85A20",
  lavender: "#F0ECFF",
  lavenderText: "#6550B8",
  red: "#CF4F5B",
};

function Icon({ name, size = 20, color = colors.ink }: { name: keyof typeof MaterialIcons.glyphMap; size?: number; color?: string }) {
  return <MaterialIcons name={name} size={size} color={color} />;
}

function money(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function initials(name: string) {
  return name.slice(0, 1).toUpperCase();
}

function Avatar({ name, small = false, muted = false }: { name: string; small?: boolean; muted?: boolean }) {
  return (
    <View style={[styles.avatar, small && styles.avatarSmall, muted && styles.avatarMuted]}>
      <Text style={[styles.avatarText, small && styles.avatarTextSmall]}>{initials(name)}</Text>
    </View>
  );
}

function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}>
          <Text style={styles.textButtonLabel}>{action}</Text>
          <Icon name="chevron-right" size={17} color={colors.blue} />
        </Pressable>
      ) : null}
    </View>
  );
}

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("plan");
  const [viewMode, setViewMode] = useState<"personal" | "group">("personal");
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [paid, setPaid] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newCategory, setNewCategory] = useState("Other");
  const [newParticipants, setNewParticipants] = useState<string[]>(["Aisha", "Rohan"]);
  const [draftOptIns, setDraftOptIns] = useState({ rafting: true, spiceMarket: true, waterfall: false });
  const [poolSettled, setPoolSettled] = useState(true);

  const total = useMemo(() => bookings.reduce((sum, booking) => sum + booking.amount, 0), [bookings]);
  const yourShare = useMemo(
    () => bookings.reduce((sum, booking) => sum + (booking.participants.includes("Aisha") ? booking.amount / booking.participants.length : 0), 0),
    [bookings],
  );
  const totalPeople = useMemo(() => new Set(bookings.flatMap((booking) => booking.participants)).size, [bookings]);

  function resetForm() {
    setNewTitle("");
    setNewAmount("");
    setNewCategory("Other");
    setNewParticipants(["Aisha", "Rohan"]);
  }

  function saveBooking() {
    const numericAmount = Number(newAmount.replace(/[^0-9]/g, ""));
    if (!newTitle.trim() || !numericAmount || newParticipants.length === 0) {
      Alert.alert("Add a booking", "Add a name, amount, and at least one participant.");
      return;
    }
    const icon = newCategory === "Stay" ? "hotel" : newCategory === "Transport" ? "local-taxi" : newCategory === "Activity" ? "kayaking" : "receipt-long";
    setBookings((current) => [
      ...current,
      {
        id: `new-${Date.now()}`,
        title: newTitle.trim(),
        subtitle: "Just added · participation split active",
        amount: numericAmount,
        category: newCategory,
        icon,
        participants: newParticipants,
        status: "Needs confirmation",
      },
    ]);
    setAddOpen(false);
    resetForm();
    setActiveTab("ledger");
  }

  function showReceiptNote() {
    Alert.alert("Receipt capture", "Prototype action ready: connect camera or upload a receipt to extract vendor, date and amount. AI only reads the receipt — the ledger math stays deterministic.");
  }

  function renderPlan() {
    const projected = 18400 - (draftOptIns.rafting ? 0 : 490);
    const raftingDelta = draftOptIns.rafting ? "Rohan opted into rafting — your projected share dropped ₹490." : "Rafting is off your plan — opt in to see the shared-cost impact.";
    const budgetRows = [
      ["Travel", 6000, 6000, "on track"],
      ["Stay", 7000, 6000, "on track"],
      ["Food", 0, 0, "unallocated"],
      ["Activities", 3000, draftOptIns.rafting ? 2450 : 0, draftOptIns.rafting ? "on track" : "unallocated"],
      ["Shopping", 0, 0, "unallocated"],
      ["Misc", 0, 0, "unallocated"],
    ] as const;
    const drafts = [
      { id: "rafting", title: "White-water rafting", subtitle: "Dandeli Adventures · 13 Sep · draft", amount: 8000, share: 2667, active: draftOptIns.rafting, icon: "kayaking" as keyof typeof MaterialIcons.glyphMap },
      { id: "spiceMarket", title: "Spice market walk", subtitle: "Proposed by Aisha · 14 Sep · draft", amount: 2400, share: 480, active: draftOptIns.spiceMarket, icon: "storefront" as keyof typeof MaterialIcons.glyphMap },
      { id: "waterfall", title: "Waterfall detour", subtitle: "Proposed by Rohan · 14 Sep · draft", amount: 3600, share: 720, active: draftOptIns.waterfall, icon: "water" as keyof typeof MaterialIcons.glyphMap },
    ];
    const toggleDraft = (id: string) => setDraftOptIns((current) => ({ ...current, [id]: !current[id as keyof typeof current] }));
    return (
      <>
        <View style={styles.planHero}>
          <View style={styles.planHeroTop}><View><Text style={styles.eyebrowLight}>PLANNING PHASE · BEFORE FUNDING</Text><Text style={styles.planHeroTitle}>Build the trip together.</Text><Text style={styles.planHeroSubtitle}>Draft the itinerary, opt in, then fund only what the group is actually planning.</Text></View><View style={styles.planHeroIcon}><Icon name="route" size={25} color="#FFFFFF" /></View></View>
          <View style={styles.planForecast}><Text style={styles.planForecastLabel}>YOUR PROJECTED COST</Text><Text style={styles.planForecastAmount}>{money(projected)}</Text><Text style={styles.planForecastFoot}>Before anything is booked or funded</Text></View>
        </View>
        <SectionHeader title="Your trip budget" action="Edit budget" onAction={() => Alert.alert("Budget setup", "Budget editing is ready: set your own total and allocate it across Travel, Stay, Food, Activities, Shopping, and Misc.")} />
        <View style={styles.budgetSummary}><View><Text style={styles.budgetSummaryLabel}>TOTAL BUDGET</Text><Text style={styles.budgetSummaryValue}>{money(23500)}</Text></View><View style={styles.budgetRemaining}><Text style={styles.budgetRemainingLabel}>UNALLOCATED</Text><Text style={styles.budgetRemainingValue}>{money(7500)}</Text></View></View>
        <View style={styles.budgetList}>{budgetRows.map(([category, budget, forecast, status]) => <View key={category} style={styles.budgetRow}><View style={styles.budgetCategory}><Text style={styles.budgetCategoryName}>{category}</Text><Text style={styles.budgetCategoryMeta}>{forecast ? `${money(forecast)} forecast` : "No draft allocation yet"}</Text></View><Text style={styles.budgetAmount}>{money(budget)}</Text><Text style={[styles.budgetStatus, status === "unallocated" && styles.budgetStatusMuted]}>{status}</Text></View>)}</View>
        <SectionHeader title="Draft itinerary · opt-in" action="Add draft" onAction={() => Alert.alert("Draft activity", "Organisers can add proposed bookings here. Drafts are not confirmed and do not draw from the trip pool.")} />
        <View style={styles.draftNotice}><Icon name="edit-calendar" size={18} color={colors.peachText} /><Text style={styles.draftNoticeText}>Drafts are proposals only — no booking is confirmed and no funds move until the group agrees.</Text></View>
        {drafts.map((draft) => <View key={draft.id} style={styles.draftRow}><View style={[styles.draftIcon, { backgroundColor: draft.active ? colors.blueSoft : colors.bg }]}><Icon name={draft.icon} size={20} color={draft.active ? colors.blue : colors.faint} /></View><View style={styles.draftContent}><View style={styles.draftTitleRow}><Text style={styles.draftTitle}>{draft.title}</Text><View style={styles.draftPill}><Text style={styles.draftPillText}>DRAFT</Text></View></View><Text style={styles.draftSubtitle}>{draft.subtitle}</Text><Text style={styles.draftShare}>{draft.active ? `${money(draft.share)} projected share` : "Not opted in"}</Text></View><Switch value={draft.active} onValueChange={() => toggleDraft(draft.id)} trackColor={{ false: colors.line, true: "#B8C9F4" }} thumbColor={draft.active ? colors.blue : "#FFFFFF"} /></View>)}
        <View style={styles.deltaCard}><View style={styles.deltaIcon}><Icon name="trending-down" size={17} color={colors.mintText} /></View><View style={{ flex: 1 }}><Text style={styles.deltaTitle}>Live forecast update</Text><Text style={styles.deltaText}>{raftingDelta}</Text></View></View>
        <SectionHeader title="Forecast vs. budget" />
        <View style={styles.forecastCard}><View style={styles.forecastRow}><Avatar name="Aisha" small /><View style={{ flex: 1 }}><Text style={styles.forecastName}>Aisha · you</Text><Text style={styles.forecastMeta}>Forecast {money(projected)} of {money(23500)}</Text></View><Text style={styles.onTrack}>ON TRACK</Text></View><View style={styles.forecastBar}><View style={[styles.forecastFill, { width: `${Math.min(100, (projected / 23500) * 100)}%` }]} /></View><View style={styles.forecastRow}><Avatar name="Rohan" small /><View style={{ flex: 1 }}><Text style={styles.forecastName}>Rohan</Text><Text style={styles.forecastMeta}>Forecast ₹19,200 of ₹18,000</Text></View><Text style={styles.overBudget}>OVER BY ₹1,200</Text></View><View style={styles.forecastBar}><View style={[styles.forecastFill, styles.forecastOver, { width: "100%" }]} /></View></View>
        <View style={styles.poolContributionCard}><View style={styles.poolContributionIcon}><Icon name="account-balance" size={18} color={colors.blue} /></View><View style={{ flex: 1 }}><Text style={styles.poolContributionTitle}>Required pool contribution</Text><Text style={styles.poolContributionText}>Fund {money(projected)} when the group confirms. The amount follows the forecast, not a guess.</Text></View><Icon name="arrow-forward" size={17} color={colors.blue} /></View>
      </>
    );
  }

  function renderOverview() {
    return (
      <>
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.eyebrowLight}>ACTIVE TRIP · 04 MEMBERS</Text>
              <Text style={styles.heroTitle}>Monsoon Escape</Text>
              <Text style={styles.heroSubtitle}>Dandeli · 12–15 Sep 2026</Text>
            </View>
            <View style={styles.heroIcon}><Icon name="landscape" size={26} color="#FFFFFF" /></View>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroBottomRow}>
            <View>
              <Text style={styles.heroMetaLabel}>TRIP SPEND</Text>
              <Text style={styles.heroAmount}>{money(total)}</Text>
            </View>
            <View style={styles.avatarStack}>
              {members.slice(0, 4).map((member, index) => <View key={member} style={{ marginLeft: index === 0 ? 0 : -8 }}><Avatar name={member} small /></View>)}
              <View style={styles.moreAvatar}><Text style={styles.moreAvatarText}>+1</Text></View>
            </View>
          </View>
        </View>

        <SectionHeader title="Your snapshot" action="Group view" onAction={() => setViewMode(viewMode === "personal" ? "group" : "personal")} />
        <View style={styles.snapshotRow}>
          <View style={[styles.snapshotCard, styles.snapshotBlue]}>
            <View style={styles.snapshotIcon}><Icon name="account-balance-wallet" size={18} color={colors.blue} /></View>
            <Text style={styles.snapshotLabel}>{viewMode === "personal" ? "YOU OWE" : "GROUP POOL"}</Text>
            <Text style={styles.snapshotValue}>{viewMode === "personal" ? money(paid ? 0 : 1240) : money(30000)}</Text>
            <Text style={styles.snapshotFoot}>{paid ? "Settled just now" : "2 items to review"}</Text>
          </View>
          <View style={[styles.snapshotCard, styles.snapshotMint]}>
            <View style={[styles.snapshotIcon, { backgroundColor: "#D2F0E5" }]}><Icon name="trending-down" size={18} color={colors.mintText} /></View>
            <Text style={styles.snapshotLabel}>SAVED TRANSFERS</Text>
            <Text style={styles.snapshotValue}>3</Text>
            <Text style={styles.snapshotFoot}>vs. everyone paying everyone</Text>
          </View>
        </View>

        <SectionHeader title="Quick actions" />
        <View style={styles.quickGrid}>
          <Pressable onPress={() => setAddOpen(true)} style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}>
            <View style={[styles.quickIcon, { backgroundColor: colors.blueSoft }]}><Icon name="add" size={20} color={colors.blue} /></View>
            <Text style={styles.quickLabel}>Add booking</Text>
            <Text style={styles.quickSub}>Split by participation</Text>
          </Pressable>
          <Pressable onPress={showReceiptNote} style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}>
            <View style={[styles.quickIcon, { backgroundColor: colors.peach }]}><Icon name="document-scanner" size={20} color={colors.peachText} /></View>
            <Text style={styles.quickLabel}>Scan receipt</Text>
            <Text style={styles.quickSub}>AI extracts details</Text>
          </Pressable>
          <Pressable onPress={() => Alert.alert("Invite members", "Share this trip with your group using a deep link. Group size is unlimited.")} style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}>
            <View style={[styles.quickIcon, { backgroundColor: colors.lavender }]}><Icon name="person-add-alt-1" size={20} color={colors.lavenderText} /></View>
            <Text style={styles.quickLabel}>Invite group</Text>
            <Text style={styles.quickSub}>Unlimited group size</Text>
          </Pressable>
        </View>

        <SectionHeader title="Upcoming bookings" action="See ledger" onAction={() => setActiveTab("ledger")} />
        {bookings.slice(0, 3).map((booking) => <BookingRow key={booking.id} booking={booking} onPress={() => setBreakdownOpen(true)} />)}

        <View style={styles.insightCard}>
          <View style={styles.insightMark}><Icon name="auto-awesome" size={17} color={colors.blue} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.insightTitle}>The itinerary is the ledger.</Text>
            <Text style={styles.insightText}>Your shares are derived from who participates in each booking. No manual split math.</Text>
          </View>
          <Icon name="chevron-right" size={18} color={colors.faint} />
        </View>
      </>
    );
  }

  function renderLedger() {
    return (
      <>
        <View style={styles.ledgerHeaderCard}>
          <View>
            <Text style={styles.eyebrow}>LIVE LEDGER</Text>
            <Text style={styles.ledgerTotal}>{money(total)}</Text>
            <Text style={styles.ledgerCaption}>{bookings.length} bookings · {totalPeople} participants · recalculated just now</Text>
          </View>
          <View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE</Text></View>
        </View>
        <View style={styles.ledgerToolRow}>
          <View style={styles.toolPill}><Icon name="tune" size={16} color={colors.blue} /><Text style={styles.toolText}>Participation rules</Text></View>
          <Pressable onPress={() => setAddOpen(true)} style={({ pressed }) => [styles.addMini, pressed && styles.pressed]}><Icon name="add" size={17} color={colors.blue} /><Text style={styles.addMiniText}>Booking</Text></Pressable>
        </View>
        <SectionHeader title="Bookings & derived shares" />
        {bookings.map((booking) => <BookingRow key={booking.id} booking={booking} onPress={() => setBreakdownOpen(true)} detail />)}
        <View style={styles.refundCard}>
          <View style={styles.refundIcon}><Icon name="replay" size={18} color={colors.peachText} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.refundTitle}>Refund routing is ready</Text>
            <Text style={styles.refundText}>{money(18000)} refund routes to the cost-bearers, not automatically to the person who paid the vendor.</Text>
          </View>
          <Icon name="chevron-right" size={18} color={colors.faint} />
        </View>
        <Pressable onPress={() => setActiveTab("activity")} style={({ pressed }) => [styles.auditLink, pressed && styles.pressed]}>
          <Icon name="manage-search" size={18} color={colors.blue} />
          <Text style={styles.auditLinkText}>See audit trail for every balance change</Text>
          <Icon name="arrow-forward" size={17} color={colors.blue} />
        </Pressable>
      </>
    );
  }

  function renderSettle() {
    return (
      <>
        <View style={styles.settleHero}>
          <Text style={styles.eyebrowLight}>YOUR SETTLEMENT</Text>
          <Text style={styles.settleAmount}>{money(paid ? 0 : 1240)}</Text>
          <Text style={styles.settleCaption}>{paid ? "You’re all caught up for this trip." : "You owe 2 members · optimised to 1 transfer"}</Text>
          <View style={styles.settleLine} />
          <View style={styles.settleStats}><Text style={styles.settleStat}>Based on 3 bookings</Text><Text style={styles.settleStat}>•</Text><Text style={styles.settleStat}>Updated 2m ago</Text></View>
        </View>
        <SectionHeader title="Recommended settlement" />
        <View style={styles.transferCard}>
          <View style={styles.transferPerson}><Avatar name="Amit" /><View><Text style={styles.transferName}>Pay Amit</Text><Text style={styles.transferReason}>He fronted the hotel booking</Text></View></View>
          <Text style={styles.transferAmount}>{money(paid ? 0 : 1240)}</Text>
          <View style={styles.transferBreakdown}><Text style={styles.transferBreakdownText}>Hotel share · ₹750</Text><Text style={styles.transferBreakdownText}>Rafting share · ₹490</Text></View>
          <View style={styles.poolSettledBanner}><View style={styles.poolSettledIcon}><Icon name="check-circle" size={18} color={colors.mintText} /></View><View style={{ flex: 1 }}><Text style={styles.poolSettledTitle}>Settled from trip pool</Text><Text style={styles.poolSettledText}>Confirmed today at 10:42 AM · no manual transfer needed</Text></View></View>
          <Pressable onPress={() => { setPaid(true); Alert.alert("Outside-pool payment", "This cash payment has been recorded. The pool settlement remains the default path."); }} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            <Icon name={paid ? "check" : "payments"} size={17} color={colors.muted} /><Text style={styles.secondaryButtonText}>{paid ? "Outside-pool payment recorded" : "I paid outside the pool"}</Text>
          </Pressable>
        </View>
        <View style={styles.optimizerCard}>
          <View style={styles.optimizerIcon}><Icon name="credit-card" size={18} color={colors.lavenderText} /></View>
          <View style={{ flex: 1 }}><Text style={styles.optimizerTitle}>Card-aware optimiser</Text><Text style={styles.optimizerText}>Suggests which member should pay a booking based on their registered cards to capture the best available discount. That member is reimbursed from the trip pool, so the savings benefit everyone.</Text></View>
          <Switch value={true} onValueChange={() => {}} trackColor={{ false: colors.line, true: "#B8C9F4" }} thumbColor={colors.blue} />
        </View>
        <SectionHeader title="Trip close-out" />
        <View style={styles.closeCard}><View style={styles.closeRow}><Icon name="account-balance" size={19} color={colors.mintText} /><Text style={styles.closeTitle}>Unspent balance returns to original sources</Text></View><Text style={styles.closeText}>At trip close, every member receives a settlement statement. Payment custody stays with the licensed partner.</Text></View>
      </>
    );
  }

  function renderActivity() {
    const events = [
      { icon: "sync", tone: colors.blueSoft, color: colors.blue, title: "Balance recalculated", text: "Rohan joined White-water rafting · your share changed by ₹490", time: "2 min ago" },
      { icon: "replay", tone: colors.peach, color: colors.peachText, title: "Refund routing created", text: "Hotel refund of ₹18,000 assigned to the four cost-bearers", time: "Yesterday" },
      { icon: "receipt-long", tone: colors.lavender, color: colors.lavenderText, title: "Receipt captured", text: "Airport cabs · ₹3,600 · paid by Amit", time: "Yesterday" },
      { icon: "person-add-alt-1", tone: colors.mint, color: colors.mintText, title: "Priya changed participation", text: "Removed from rafting · hotel share remains active", time: "Mon, 09:14" },
    ] as const;
    return (
      <>
        <View style={styles.auditHero}><View style={styles.auditHeroIcon}><Icon name="manage-search" size={23} color={colors.blue} /></View><View style={{ flex: 1 }}><Text style={styles.auditHeroTitle}>A transparent ledger</Text><Text style={styles.auditHeroText}>Every balance can be traced to a booking, payment, participant, or adjustment.</Text></View></View>
        <View style={styles.auditControls}><Text style={styles.auditCount}>4 EVENTS</Text><View style={styles.filterPill}><Icon name="filter-list" size={15} color={colors.muted} /><Text style={styles.filterText}>All activity</Text><Icon name="expand-more" size={16} color={colors.muted} /></View></View>
        <View style={styles.timeline}>{events.map((event, index) => <View key={event.title} style={styles.timelineRow}><View style={styles.timelineRail}><View style={[styles.timelineIcon, { backgroundColor: event.tone }]}><Icon name={event.icon} size={17} color={event.color} /></View>{index < events.length - 1 ? <View style={styles.railLine} /> : null}</View><View style={styles.eventBody}><View style={styles.eventTitleRow}><Text style={styles.eventTitle}>{event.title}</Text><Text style={styles.eventTime}>{event.time}</Text></View><Text style={styles.eventText}>{event.text}</Text></View></View>)}</View>
        <View style={styles.deterministicCard}><Icon name="verified-user" size={19} color={colors.mintText} /><View style={{ flex: 1 }}><Text style={styles.deterministicTitle}>Deterministic by design</Text><Text style={styles.deterministicText}>AI can read receipts and answer ledger questions. It never calculates balances.</Text></View></View>
      </>
    );
  }

  function renderProfile() {
    return (
      <>
        <View style={styles.profileCard}><Avatar name="Aisha" /><View style={{ flex: 1 }}><Text style={styles.profileName}>Aisha Khan</Text><Text style={styles.profileEmail}>aisha@grouptrip.app</Text></View><Pressable onPress={() => Alert.alert("Profile", "Profile editing is ready for the next prototype pass.")} style={styles.iconButton}><Icon name="edit" size={18} color={colors.blue} /></Pressable></View>
        <SectionHeader title="View mode" />
        <View style={styles.segmented}><Pressable onPress={() => setViewMode("personal")} style={[styles.segment, viewMode === "personal" && styles.segmentActive]}><Icon name="person-outline" size={17} color={viewMode === "personal" ? colors.blue : colors.muted} /><Text style={[styles.segmentText, viewMode === "personal" && styles.segmentTextActive]}>Personal</Text></Pressable><Pressable onPress={() => setViewMode("group")} style={[styles.segment, viewMode === "group" && styles.segmentActive]}><Icon name="groups" size={17} color={viewMode === "group" ? colors.blue : colors.muted} /><Text style={[styles.segmentText, viewMode === "group" && styles.segmentTextActive]}>Group view</Text></Pressable></View>
        <SectionHeader title="Connected tools" />
        <View style={styles.settingCard}><SettingRow icon="credit-card" title="Payment partner" subtitle="Custody outside GroupTrip Ledger" tone={colors.mint} /><SettingRow icon="travel-explore" title="Travel APIs" subtitle="Deep-link bookings into your trip" tone={colors.blueSoft} /><SettingRow icon="notifications-none" title="Notifications" subtitle="Real-time group updates enabled" tone={colors.peach} /></View>
        <SectionHeader title="Prototype roadmap" />
        <View style={styles.roadmapCard}><Text style={styles.roadmapIntro}>In build now: disputes, budget guardrails, and multi-currency settlement.</Text><View style={styles.roadmapGrid}>{["Vendor onboarding", "Corporate approval workflows"].map((item) => <View key={item} style={styles.roadmapPill}><Text style={styles.roadmapPillText}>{item}</Text><Text style={styles.futureLabel}>NEXT</Text></View>)}</View></View>
        <Text style={styles.version}>GROUPTRIP LEDGER · PROTOTYPE 0.1</Text>
      </>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} containerClassName="bg-[#F5F8FC]">
      <StatusBar barStyle="dark-content" />
      <View style={styles.appShell}>
        <View style={styles.topBar}><View><Text style={styles.greeting}>Good morning, Aisha</Text><Text style={styles.topSubtitle}>{activeTab === "plan" ? "Set the budget before the bookings" : activeTab === "overview" ? "Here’s what’s moving in your trip" : activeTab === "ledger" ? "Every booking, one source of truth" : activeTab === "settle" ? "Close the loop with fewer transfers" : activeTab === "activity" ? "Trace every change with confidence" : "Your account and trip controls"}</Text></View><Pressable onPress={() => setActiveTab("profile")} style={({ pressed }) => [styles.topAvatar, pressed && styles.pressed]}><Text style={styles.topAvatarText}>AK</Text></Pressable></View>
        <View style={styles.tripSwitcher}><View style={styles.tripSwitcherLeft}><View style={styles.tripDot}><Icon name="flight-takeoff" size={16} color="#FFFFFF" /></View><View><Text style={styles.tripSwitcherLabel}>CURRENT TRIP</Text><Text style={styles.tripSwitcherTitle}>Monsoon Escape</Text></View></View><Icon name="keyboard-arrow-down" size={20} color={colors.muted} /></View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {activeTab === "plan" ? renderPlan() : activeTab === "overview" ? renderOverview() : activeTab === "ledger" ? renderLedger() : activeTab === "settle" ? renderSettle() : activeTab === "activity" ? renderActivity() : renderProfile()}
          <View style={{ height: 96 }} />
        </ScrollView>
        <View style={styles.bottomNav}>{(["plan", "overview", "ledger", "settle", "activity", "profile"] as Tab[]).map((tab) => { const meta = { plan: ["route", "Plan"], overview: ["home", "Home"], ledger: ["account-balance-wallet", "Ledger"], settle: ["payments", "Settle"], activity: ["timeline", "Activity"], profile: ["person-outline", "Profile"] }[tab] as [keyof typeof MaterialIcons.glyphMap, string]; return <Pressable key={tab} onPress={() => setActiveTab(tab)} style={({ pressed }) => [styles.navItem, pressed && styles.pressed]}><Icon name={meta[0]} size={22} color={activeTab === tab ? colors.blue : colors.faint} /><Text style={[styles.navLabel, activeTab === tab && styles.navLabelActive]}>{meta[1]}</Text>{activeTab === tab ? <View style={styles.navIndicator} /> : null}</Pressable>; })}</View>
      </View>

      <Modal visible={addOpen} animationType="slide" transparent onRequestClose={() => setAddOpen(false)}>
        <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === "ios" ? "padding" : undefined}><View style={styles.modalCard}><View style={styles.modalHeader}><View><Text style={styles.modalEyebrow}>NEW LEDGER ITEM</Text><Text style={styles.modalTitle}>Add a booking</Text></View><Pressable onPress={() => setAddOpen(false)} style={styles.closeButton}><Icon name="close" size={21} color={colors.ink} /></Pressable></View><Text style={styles.inputLabel}>What did you book?</Text><TextInput value={newTitle} onChangeText={setNewTitle} placeholder="e.g. Sunset kayaking" placeholderTextColor={colors.faint} style={styles.input} /><Text style={styles.inputLabel}>Amount</Text><TextInput value={newAmount} onChangeText={setNewAmount} placeholder="₹ 0" placeholderTextColor={colors.faint} keyboardType="numeric" style={styles.input} /><Text style={styles.inputLabel}>Category</Text><View style={styles.categoryRow}>{["Stay", "Activity", "Transport", "Other"].map((category) => <Pressable key={category} onPress={() => setNewCategory(category)} style={[styles.categoryChip, newCategory === category && styles.categoryChipActive]}><Text style={[styles.categoryChipText, newCategory === category && styles.categoryChipTextActive]}>{category}</Text></Pressable>)}</View><Text style={styles.inputLabel}>Who is participating?</Text><View style={styles.participantsRow}>{members.map((member) => { const selected = newParticipants.includes(member); return <Pressable key={member} onPress={() => setNewParticipants((current) => selected ? current.filter((item) => item !== member) : [...current, member])} style={[styles.participantChip, selected && styles.participantChipActive]}><View style={[styles.checkCircle, selected && styles.checkCircleActive]}>{selected ? <Icon name="check" size={11} color="#FFFFFF" /> : null}</View><Text style={[styles.participantText, selected && styles.participantTextActive]}>{member}</Text></Pressable>; })}</View><View style={styles.derivedNote}><Icon name="auto-awesome" size={16} color={colors.blue} /><Text style={styles.derivedNoteText}>Shares will be derived automatically from participation.</Text></View><Pressable onPress={saveBooking} style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}><Text style={styles.saveButtonText}>Save booking</Text><Icon name="arrow-forward" size={18} color="#FFFFFF" /></Pressable></View></KeyboardAvoidingView>
      </Modal>

      <Modal visible={breakdownOpen} animationType="fade" transparent onRequestClose={() => setBreakdownOpen(false)}>
        <View style={styles.modalBackdrop}><View style={styles.breakdownCard}><View style={styles.modalHeader}><View><Text style={styles.modalEyebrow}>DERIVED SHARE</Text><Text style={styles.modalTitle}>Why you owe this</Text></View><Pressable onPress={() => setBreakdownOpen(false)} style={styles.closeButton}><Icon name="close" size={21} color={colors.ink} /></Pressable></View><View style={styles.traceStep}><View style={styles.traceNumber}><Text style={styles.traceNumberText}>1</Text></View><View><Text style={styles.traceTitle}>Booking</Text><Text style={styles.traceText}>Hotel · 3 nights · ₹24,000</Text></View></View><View style={styles.traceLine} /><View style={styles.traceStep}><View style={styles.traceNumber}><Text style={styles.traceNumberText}>2</Text></View><View><Text style={styles.traceTitle}>Participation</Text><Text style={styles.traceText}>4 of 5 members are included</Text></View></View><View style={styles.traceLine} /><View style={styles.traceStep}><View style={styles.traceNumber}><Text style={styles.traceNumberText}>3</Text></View><View><Text style={styles.traceTitle}>Your derived share</Text><Text style={styles.traceText}>₹24,000 ÷ 4 participants = ₹6,000</Text></View></View><View style={styles.breakdownResult}><Text style={styles.breakdownResultLabel}>BALANCE IMPACT</Text><Text style={styles.breakdownResultValue}>+₹6,000</Text></View><Text style={styles.breakdownFooter}>Change participation later and this amount recalculates automatically. The audit trail keeps the explanation.</Text><Pressable onPress={() => setBreakdownOpen(false)} style={styles.doneButton}><Text style={styles.doneButtonText}>Done</Text></Pressable></View></View>
      </Modal>
    </ScreenContainer>
  );
}

function BookingRow({ booking, onPress, detail = false }: { booking: Booking; onPress: () => void; detail?: boolean }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.bookingRow, pressed && styles.pressed]}><View style={[styles.bookingIcon, booking.category === "Stay" ? { backgroundColor: colors.blueSoft } : booking.category === "Activity" ? { backgroundColor: colors.mint } : { backgroundColor: colors.peach }]}><Icon name={booking.icon} size={20} color={booking.category === "Stay" ? colors.blue : booking.category === "Activity" ? colors.mintText : colors.peachText} /></View><View style={styles.bookingContent}><View style={styles.bookingTitleRow}><Text style={styles.bookingTitle}>{booking.title}</Text><Text style={styles.bookingAmount}>{money(booking.amount)}</Text></View><Text style={styles.bookingSub}>{booking.subtitle}</Text>{detail ? <View style={styles.bookingDetail}><Text style={styles.participantCount}>{booking.participants.length} participants</Text><View style={styles.miniAvatars}>{booking.participants.slice(0, 4).map((member) => <Avatar key={member} name={member} small muted />)}</View><Text style={styles.derivedLabel}>Derived split</Text></View> : <View style={styles.statusRow}><View style={[styles.statusDot, { backgroundColor: booking.status === "Confirmed" ? colors.mintText : colors.peachText }]} /><Text style={styles.statusText}>{booking.status}</Text><Text style={styles.shareText}>{booking.participants.includes("Aisha") ? `${money(Math.round(booking.amount / booking.participants.length))} your share` : "Not participating"}</Text></View>}</View><Icon name="chevron-right" size={19} color={colors.faint} /></Pressable>;
}

function SettingRow({ icon, title, subtitle, tone }: { icon: keyof typeof MaterialIcons.glyphMap; title: string; subtitle: string; tone: string }) {
  return <View style={styles.settingRow}><View style={[styles.settingIcon, { backgroundColor: tone }]}><Icon name={icon} size={18} color={colors.ink} /></View><View style={{ flex: 1 }}><Text style={styles.settingTitle}>{title}</Text><Text style={styles.settingSubtitle}>{subtitle}</Text></View><Icon name="check-circle" size={18} color={colors.mintText} /></View>;
}

const styles = StyleSheet.create({
  appShell: { flex: 1, width: "100%", maxWidth: 430, alignSelf: "center", backgroundColor: colors.bg },
  topBar: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  greeting: { color: colors.ink, fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  topSubtitle: { color: colors.muted, fontSize: 12, marginTop: 4 },
  topAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
  topAvatarText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  tripSwitcher: { marginHorizontal: 20, marginBottom: 8, padding: 12, borderRadius: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  tripSwitcherLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  tripDot: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.blue, alignItems: "center", justifyContent: "center" },
  tripSwitcherLabel: { color: colors.faint, fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  tripSwitcherTitle: { color: colors.ink, fontSize: 14, fontWeight: "700", marginTop: 2 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  heroCard: { borderRadius: 20, padding: 20, backgroundColor: colors.ink, marginBottom: 22, shadowColor: colors.ink, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.16, shadowRadius: 16, elevation: 7 },
  heroTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  eyebrowLight: { color: "#91B8EE", fontSize: 9, letterSpacing: 1.2, fontWeight: "800" },
  heroTitle: { color: "#FFFFFF", fontSize: 25, fontWeight: "800", letterSpacing: -0.6, marginTop: 8 },
  heroSubtitle: { color: "#B6C6DA", fontSize: 12, marginTop: 5 },
  heroIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: "#27456D", alignItems: "center", justifyContent: "center" },
  heroDivider: { height: 1, backgroundColor: "#2D4668", marginVertical: 20 },
  heroBottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  heroMetaLabel: { color: "#91A7C1", fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  heroAmount: { color: "#FFFFFF", fontSize: 22, fontWeight: "800", marginTop: 5 },
  avatarStack: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#E0ECFF", borderWidth: 2, borderColor: colors.card, alignItems: "center", justifyContent: "center" },
  avatarSmall: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, backgroundColor: "#D9E8FF" },
  avatarMuted: { backgroundColor: "#EFF3F8", borderColor: colors.card },
  avatarText: { color: colors.blue, fontSize: 13, fontWeight: "800" },
  avatarTextSmall: { fontSize: 9 },
  moreAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#314F75", borderWidth: 2, borderColor: colors.ink, alignItems: "center", justifyContent: "center", marginLeft: -8 },
  moreAvatarText: { color: "#FFFFFF", fontSize: 9, fontWeight: "800" },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 11, marginTop: 2 },
  sectionTitle: { color: colors.ink, fontSize: 15, fontWeight: "800", letterSpacing: -0.2 },
  textButton: { flexDirection: "row", alignItems: "center", gap: 2 },
  textButtonLabel: { color: colors.blue, fontSize: 12, fontWeight: "700" },
  snapshotRow: { flexDirection: "row", gap: 10, marginBottom: 23 },
  snapshotCard: { flex: 1, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.line },
  snapshotBlue: { backgroundColor: "#EDF4FF" },
  snapshotMint: { backgroundColor: "#ECF8F3" },
  snapshotIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: "#D8E8FF", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  snapshotLabel: { color: colors.muted, fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  snapshotValue: { color: colors.ink, fontSize: 20, fontWeight: "800", marginTop: 4 },
  snapshotFoot: { color: colors.muted, fontSize: 10, marginTop: 4, lineHeight: 14 },
  quickGrid: { flexDirection: "row", gap: 8, marginBottom: 23 },
  quickAction: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 11, minHeight: 116 },
  quickIcon: { width: 31, height: 31, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  quickLabel: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  quickSub: { color: colors.faint, fontSize: 9, lineHeight: 13, marginTop: 4 },
  bookingRow: { backgroundColor: colors.card, borderRadius: 15, borderWidth: 1, borderColor: colors.line, padding: 12, flexDirection: "row", alignItems: "center", marginBottom: 9 },
  bookingIcon: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center", marginRight: 11 },
  bookingContent: { flex: 1, minWidth: 0 },
  bookingTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  bookingTitle: { color: colors.ink, fontSize: 12, fontWeight: "800", flex: 1 },
  bookingAmount: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  bookingSub: { color: colors.muted, fontSize: 10, marginTop: 4 },
  statusRow: { flexDirection: "row", alignItems: "center", marginTop: 7 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  statusText: { color: colors.muted, fontSize: 10 },
  shareText: { color: colors.blue, fontSize: 10, fontWeight: "700", marginLeft: "auto" },
  bookingDetail: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  participantCount: { color: colors.muted, fontSize: 10 },
  miniAvatars: { flexDirection: "row", marginLeft: 8 },
  derivedLabel: { color: colors.blue, fontSize: 9, fontWeight: "700", marginLeft: "auto" },
  insightCard: { backgroundColor: "#EFF5FF", borderRadius: 15, borderWidth: 1, borderColor: "#D8E6FC", padding: 14, flexDirection: "row", alignItems: "center", gap: 10, marginTop: 7 },
  insightMark: { width: 30, height: 30, borderRadius: 10, backgroundColor: "#DCEAFF", alignItems: "center", justifyContent: "center" },
  insightTitle: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  insightText: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
  ledgerHeaderCard: { backgroundColor: colors.card, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: colors.line, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  eyebrow: { color: colors.blue, fontSize: 9, letterSpacing: 1.2, fontWeight: "800" },
  ledgerTotal: { color: colors.ink, fontSize: 27, fontWeight: "800", letterSpacing: -0.7, marginTop: 7 },
  ledgerCaption: { color: colors.muted, fontSize: 10, marginTop: 5 },
  livePill: { borderRadius: 20, backgroundColor: colors.mint, paddingHorizontal: 9, paddingVertical: 5, flexDirection: "row", alignItems: "center", gap: 5 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.mintText },
  liveText: { color: colors.mintText, fontSize: 9, fontWeight: "800", letterSpacing: 0.7 },
  ledgerToolRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 19 },
  toolPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 10, backgroundColor: colors.blueSoft },
  toolText: { color: colors.blue, fontSize: 10, fontWeight: "700" },
  addMini: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 9, paddingVertical: 6 },
  addMiniText: { color: colors.blue, fontSize: 11, fontWeight: "800" },
  refundCard: { backgroundColor: colors.peach, borderRadius: 15, padding: 14, flexDirection: "row", gap: 10, alignItems: "center", marginTop: 11 },
  refundIcon: { width: 31, height: 31, borderRadius: 10, backgroundColor: "#FFE1CA", alignItems: "center", justifyContent: "center" },
  refundTitle: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  refundText: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
  auditLink: { flexDirection: "row", gap: 8, alignItems: "center", paddingVertical: 16 },
  auditLinkText: { color: colors.blue, fontSize: 11, fontWeight: "700", flex: 1 },
  settleHero: { backgroundColor: colors.ink, borderRadius: 20, padding: 20, marginBottom: 23 },
  settleAmount: { color: "#FFFFFF", fontSize: 38, fontWeight: "800", letterSpacing: -1.2, marginTop: 8 },
  settleCaption: { color: "#B6C6DA", fontSize: 12, marginTop: 4 },
  settleLine: { height: 1, backgroundColor: "#2D4668", marginVertical: 17 },
  settleStats: { flexDirection: "row", gap: 8 },
  settleStat: { color: "#91A7C1", fontSize: 10 },
  transferCard: { backgroundColor: colors.card, borderRadius: 17, borderWidth: 1, borderColor: colors.line, padding: 15, marginBottom: 13 },
  transferPerson: { flexDirection: "row", alignItems: "center", gap: 10 },
  transferName: { color: colors.ink, fontSize: 14, fontWeight: "800" },
  transferReason: { color: colors.muted, fontSize: 10, marginTop: 3 },
  transferAmount: { position: "absolute", right: 16, top: 19, color: colors.ink, fontSize: 18, fontWeight: "800" },
  transferBreakdown: { backgroundColor: colors.bg, borderRadius: 11, padding: 11, marginTop: 15, gap: 6 },
  transferBreakdownText: { color: colors.muted, fontSize: 10 },
  primaryButton: { height: 42, borderRadius: 12, backgroundColor: colors.blue, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7, marginTop: 13 },
  primaryButtonDone: { backgroundColor: colors.mintText },
  primaryButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  optimizerCard: { backgroundColor: colors.lavender, borderRadius: 15, padding: 14, flexDirection: "row", gap: 10, alignItems: "flex-start", marginBottom: 23 },
  optimizerIcon: { width: 31, height: 31, borderRadius: 10, backgroundColor: "#E0D8FF", alignItems: "center", justifyContent: "center" },
  optimizerTitle: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  optimizerText: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
  closeCard: { backgroundColor: colors.card, borderRadius: 15, padding: 14, borderWidth: 1, borderColor: colors.line },
  closeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  closeTitle: { color: colors.ink, fontSize: 12, fontWeight: "800", flex: 1 },
  closeText: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 9 },
  auditHero: { backgroundColor: colors.blueSoft, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 },
  auditHeroIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: "#D5E6FF", alignItems: "center", justifyContent: "center" },
  auditHeroTitle: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  auditHeroText: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 3 },
  auditControls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  auditCount: { color: colors.faint, fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  filterPill: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 9, paddingHorizontal: 8, paddingVertical: 6, flexDirection: "row", alignItems: "center", gap: 4 },
  filterText: { color: colors.muted, fontSize: 10 },
  timeline: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: 14 },
  timelineRow: { flexDirection: "row" },
  timelineRail: { width: 34, alignItems: "center" },
  timelineIcon: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  railLine: { width: 1, backgroundColor: colors.line, flex: 1, minHeight: 34 },
  eventBody: { flex: 1, paddingLeft: 9, paddingBottom: 18 },
  eventTitleRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  eventTitle: { color: colors.ink, fontSize: 12, fontWeight: "800", flex: 1 },
  eventTime: { color: colors.faint, fontSize: 9 },
  eventText: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
  deterministicCard: { backgroundColor: colors.mint, borderRadius: 15, padding: 14, flexDirection: "row", gap: 9, alignItems: "flex-start", marginTop: 12 },
  deterministicTitle: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  deterministicText: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
  profileCard: { backgroundColor: colors.card, borderRadius: 16, padding: 15, borderWidth: 1, borderColor: colors.line, flexDirection: "row", alignItems: "center", gap: 11, marginBottom: 23 },
  profileName: { color: colors.ink, fontSize: 15, fontWeight: "800" },
  profileEmail: { color: colors.muted, fontSize: 10, marginTop: 4 },
  iconButton: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.blueSoft, alignItems: "center", justifyContent: "center" },
  segmented: { flexDirection: "row", backgroundColor: "#EAF0F7", padding: 4, borderRadius: 13, marginBottom: 23 },
  segment: { flex: 1, height: 36, borderRadius: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  segmentActive: { backgroundColor: colors.card, shadowColor: colors.ink, shadowOpacity: 0.06, shadowRadius: 5, elevation: 2 },
  segmentText: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  segmentTextActive: { color: colors.blue },
  settingCard: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14, marginBottom: 23 },
  settingRow: { flexDirection: "row", alignItems: "center", paddingVertical: 13, gap: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
  settingIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  settingTitle: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  settingSubtitle: { color: colors.muted, fontSize: 10, marginTop: 3 },
  roadmapCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 14 },
  roadmapIntro: { color: colors.muted, fontSize: 10, marginBottom: 12 },
  roadmapGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  roadmapPill: { width: "48%", backgroundColor: colors.bg, borderRadius: 11, padding: 10 },
  roadmapPillText: { color: colors.ink, fontSize: 10, fontWeight: "700" },
  futureLabel: { color: colors.faint, fontSize: 8, fontWeight: "800", letterSpacing: 0.8, marginTop: 5 },
  version: { color: colors.faint, fontSize: 9, textAlign: "center", letterSpacing: 1, marginTop: 28 },
  planHero: { backgroundColor: colors.ink, borderRadius: 20, padding: 18, marginBottom: 22, shadowColor: colors.ink, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 15, elevation: 6 },
  planHeroTop: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  planHeroTitle: { color: "#FFFFFF", fontSize: 24, fontWeight: "800", letterSpacing: -0.6, marginTop: 8 },
  planHeroSubtitle: { color: "#B6C6DA", fontSize: 11, lineHeight: 16, marginTop: 5, maxWidth: 280 },
  planHeroIcon: { width: 45, height: 45, borderRadius: 14, backgroundColor: "#27456D", alignItems: "center", justifyContent: "center" },
  planForecast: { borderTopWidth: 1, borderTopColor: "#2D4668", marginTop: 17, paddingTop: 15 },
  planForecastLabel: { color: "#91A7C1", fontSize: 9, letterSpacing: 1, fontWeight: "800" },
  planForecastAmount: { color: "#FFFFFF", fontSize: 29, fontWeight: "800", marginTop: 5 },
  planForecastFoot: { color: "#B6C6DA", fontSize: 10, marginTop: 3 },
  budgetSummary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 15, flexDirection: "row", justifyContent: "space-between", marginBottom: 9 },
  budgetSummaryLabel: { color: colors.faint, fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  budgetSummaryValue: { color: colors.ink, fontSize: 21, fontWeight: "800", marginTop: 5 },
  budgetRemaining: { backgroundColor: colors.blueSoft, borderRadius: 11, padding: 10, minWidth: 112 },
  budgetRemainingLabel: { color: colors.blue, fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  budgetRemainingValue: { color: colors.ink, fontSize: 17, fontWeight: "800", marginTop: 4 },
  budgetList: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 16, paddingHorizontal: 14, marginBottom: 22 },
  budgetRow: { flexDirection: "row", alignItems: "center", paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.line, gap: 6 },
  budgetCategory: { flex: 1 },
  budgetCategoryName: { color: colors.ink, fontSize: 11, fontWeight: "800" },
  budgetCategoryMeta: { color: colors.muted, fontSize: 9, marginTop: 3 },
  budgetAmount: { color: colors.ink, fontSize: 10, fontWeight: "700", width: 55, textAlign: "right" },
  budgetStatus: { color: colors.mintText, fontSize: 8, fontWeight: "800", width: 58, textAlign: "right" },
  budgetStatusMuted: { color: colors.faint },
  draftNotice: { backgroundColor: colors.peach, borderRadius: 13, padding: 12, flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 10 },
  draftNoticeText: { color: colors.muted, fontSize: 10, lineHeight: 14, flex: 1 },
  draftRow: { backgroundColor: colors.card, borderRadius: 15, borderWidth: 1, borderColor: "#F0D8C3", borderStyle: "dashed", padding: 12, flexDirection: "row", alignItems: "center", marginBottom: 9 },
  draftIcon: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center", marginRight: 10 },
  draftContent: { flex: 1 },
  draftTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  draftTitle: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  draftPill: { backgroundColor: colors.peach, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 3 },
  draftPillText: { color: colors.peachText, fontSize: 7, fontWeight: "800", letterSpacing: 0.7 },
  draftSubtitle: { color: colors.muted, fontSize: 9, marginTop: 4 },
  draftShare: { color: colors.blue, fontSize: 9, fontWeight: "700", marginTop: 5 },
  deltaCard: { backgroundColor: colors.mint, borderRadius: 14, padding: 13, flexDirection: "row", alignItems: "center", gap: 9, marginTop: 5, marginBottom: 22 },
  deltaIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: "#D2F0E5", alignItems: "center", justifyContent: "center" },
  deltaTitle: { color: colors.ink, fontSize: 11, fontWeight: "800" },
  deltaText: { color: colors.muted, fontSize: 10, lineHeight: 14, marginTop: 3 },
  forecastCard: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: 14, marginBottom: 12 },
  forecastRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 7 },
  forecastName: { color: colors.ink, fontSize: 11, fontWeight: "800" },
  forecastMeta: { color: colors.muted, fontSize: 9, marginTop: 3 },
  onTrack: { color: colors.mintText, fontSize: 8, fontWeight: "800" },
  overBudget: { color: colors.red, fontSize: 8, fontWeight: "800" },
  forecastBar: { height: 7, borderRadius: 4, backgroundColor: colors.bg, marginBottom: 13, overflow: "hidden" },
  forecastFill: { height: 7, borderRadius: 4, backgroundColor: colors.blue },
  forecastOver: { backgroundColor: colors.red },
  poolContributionCard: { backgroundColor: colors.blueSoft, borderRadius: 15, padding: 14, flexDirection: "row", alignItems: "center", gap: 9, marginTop: 2 },
  poolContributionIcon: { width: 31, height: 31, borderRadius: 10, backgroundColor: "#D5E6FF", alignItems: "center", justifyContent: "center" },
  poolContributionTitle: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  poolContributionText: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
  poolSettledBanner: { backgroundColor: colors.mint, borderRadius: 12, padding: 11, flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14 },
  poolSettledIcon: { width: 29, height: 29, borderRadius: 9, backgroundColor: "#D2F0E5", alignItems: "center", justifyContent: "center" },
  poolSettledTitle: { color: colors.ink, fontSize: 11, fontWeight: "800" },
  poolSettledText: { color: colors.muted, fontSize: 9, marginTop: 3 },
  secondaryButton: { height: 40, borderRadius: 11, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7, marginTop: 9 },
  secondaryButtonText: { color: colors.muted, fontSize: 10, fontWeight: "700" },
  bottomNav: { position: "absolute", left: 0, right: 0, bottom: 0, height: 73, backgroundColor: "rgba(255,255,255,0.98)", borderTopWidth: 1, borderTopColor: colors.line, flexDirection: "row", paddingHorizontal: 8, paddingTop: 9 },
  navItem: { flex: 1, alignItems: "center", position: "relative", gap: 4 },
  navLabel: { color: colors.faint, fontSize: 9, fontWeight: "700" },
  navLabelActive: { color: colors.blue },
  navIndicator: { position: "absolute", top: -9, width: 20, height: 2, backgroundColor: colors.blue, borderRadius: 1 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(20,35,59,0.42)" },
  modalCard: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: Platform.OS === "ios" ? 30 : 20 },
  breakdownCard: { backgroundColor: colors.card, borderRadius: 22, padding: 20, marginHorizontal: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  modalEyebrow: { color: colors.blue, fontSize: 9, letterSpacing: 1.1, fontWeight: "800" },
  modalTitle: { color: colors.ink, fontSize: 22, fontWeight: "800", letterSpacing: -0.5, marginTop: 5 },
  closeButton: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  inputLabel: { color: colors.ink, fontSize: 11, fontWeight: "800", marginBottom: 7, marginTop: 4 },
  input: { height: 44, borderRadius: 11, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12, color: colors.ink, fontSize: 13, marginBottom: 13, backgroundColor: colors.bg },
  categoryRow: { flexDirection: "row", gap: 7, marginBottom: 15 },
  categoryChip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 9, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line },
  categoryChipActive: { backgroundColor: colors.blueSoft, borderColor: "#B7D0F7" },
  categoryChipText: { color: colors.muted, fontSize: 10, fontWeight: "700" },
  categoryChipTextActive: { color: colors.blue },
  participantsRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 13 },
  participantChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 9, paddingVertical: 7, backgroundColor: colors.bg, borderRadius: 9, borderWidth: 1, borderColor: colors.line },
  participantChipActive: { backgroundColor: colors.mint, borderColor: "#BDE4D4" },
  checkCircle: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: colors.faint, alignItems: "center", justifyContent: "center" },
  checkCircleActive: { backgroundColor: colors.mintText, borderColor: colors.mintText },
  participantText: { color: colors.muted, fontSize: 10, fontWeight: "700" },
  participantTextActive: { color: colors.mintText },
  derivedNote: { backgroundColor: colors.blueSoft, borderRadius: 10, padding: 10, flexDirection: "row", gap: 7, alignItems: "center", marginBottom: 14 },
  derivedNoteText: { color: colors.muted, fontSize: 10, flex: 1 },
  saveButton: { height: 46, borderRadius: 13, backgroundColor: colors.blue, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  saveButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  traceStep: { flexDirection: "row", alignItems: "center", gap: 10 },
  traceNumber: { width: 27, height: 27, borderRadius: 9, backgroundColor: colors.blueSoft, alignItems: "center", justifyContent: "center" },
  traceNumberText: { color: colors.blue, fontSize: 11, fontWeight: "800" },
  traceTitle: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  traceText: { color: colors.muted, fontSize: 10, marginTop: 3 },
  traceLine: { width: 1, height: 24, backgroundColor: colors.line, marginLeft: 13 },
  breakdownResult: { backgroundColor: colors.mint, borderRadius: 13, padding: 13, marginTop: 19, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  breakdownResultLabel: { color: colors.mintText, fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  breakdownResultValue: { color: colors.ink, fontSize: 18, fontWeight: "800" },
  breakdownFooter: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 13 },
  doneButton: { height: 43, borderRadius: 12, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center", marginTop: 17 },
  doneButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
});
