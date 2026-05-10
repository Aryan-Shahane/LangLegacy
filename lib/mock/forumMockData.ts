import { normalizeForumPost } from "@/lib/forumCoerce";
import type { Post } from "@/lib/types";

type RawForum = Record<string, unknown>;

function post(
  id: string,
  lang: string,
  body: string,
  author_name: string,
  author_id: string,
  created_at: string,
  extra: Partial<RawForum> = {}
): RawForum {
  return {
    _id: id,
    type: "post",
    section: "forum",
    language_code: lang,
    author_id,
    author_name,
    body,
    audio_url: null,
    reactions: {},
    reaction_users: {},
    report_count: 0,
    status: "active",
    created_at,
    ...extra,
  };
}

/** Curated demo threads keyed by lowercase language code */
const MOCK_FORUM_RAW: Record<string, RawForum[]> = {
  mi: [
    post(
      "forum_mi_root_intro",
      "mi",
      "Kia ora! Who’s coming to Saturday’s voice circle online? Keen to drill short phrases aloud together.",
      "Hine Rū",
      "demo_mi_1",
      "2026-05-06T09:05:00.000Z",
      { parent_id: null, root_id: null, depth: 0 }
    ),
    post(
      "forum_mi_reply_1",
      "mi",
      "I'll be there — 8 PM NZ works for me.",
      "Tama W.",
      "demo_mi_2",
      "2026-05-06T09:22:00.000Z",
      { parent_id: "forum_mi_root_intro", root_id: "forum_mi_root_intro", depth: 1, parent_post_id: "forum_mi_root_intro" }
    ),
    post(
      "forum_mi_reply_2",
      "mi",
      "Posting a pronunciation clip in the pronunciation room after this thread — critique welcome!",
      "Aroha K.",
      "demo_mi_3",
      "2026-05-06T09:48:00.000Z",
      { parent_id: "forum_mi_root_intro", root_id: "forum_mi_root_intro", depth: 1, parent_post_id: "forum_mi_root_intro" }
    ),
    post(
      "forum_mi_dic_q",
      "mi",
      "Dictionary question: why does our archive sometimes show IPA and sometimes no gloss under poetry? Trying to pitch it to elders.",
      "Mere T.",
      "demo_mi_4",
      "2026-05-07T14:30:00.000Z",
      { parent_id: null, root_id: null, depth: 0 }
    ),
    post(
      "forum_mi_dic_a",
      "mi",
      "It’s glossary-based — tokens only swap when headwords match. Not full machine translation.",
      "Mod demo",
      "demo_mod",
      "2026-05-07T15:05:00.000Z",
      {
        parent_id: "forum_mi_dic_q",
        root_id: "forum_mi_dic_q",
        depth: 1,
        parent_post_id: "forum_mi_dic_q",
        reply_to_author: "Mere T.",
        reaction_users: { "❤️": ["u1"], "👍": ["u2"] },
      }
    ),
  ],
  cy: [
    post(
      "forum_cy_root",
      "cy",
      "Siaradwch Gyda Fi — anyone want a bilingual practice thread Wednesdays? Cymraeg yn gyntaf, wedyn Saesneg i egluro.",
      "Elin Morgan",
      "demo_cy_1",
      "2026-05-05T11:00:00.000Z"
    ),
    post(
      "forum_cy_reply",
      "cy",
      "Dw i mewn — gallaf dechrau yn 17:30 UK.",
      "Owain Rhys",
      "demo_cy_2",
      "2026-05-05T11:40:00.000Z",
      { parent_id: "forum_cy_root", root_id: "forum_cy_root", depth: 1, parent_post_id: "forum_cy_root" }
    ),
    post(
      "forum_cy_events",
      "cy",
      "Local Eisteddfod prep: pooling songs that use archaic verb forms — drop links.",
      "Gwen Ll.",
      "demo_cy_3",
      "2026-05-08T07:55:00.000Z"
    ),
  ],
  gam: [
    post(
      "forum_gam_welcome",
      "gam",
      "Yaluu — new learners here from Tamworth HS. Respectful shout-out to Aunties correcting our recordings 🙏",
      "Jay D.",
      "demo_gam_1",
      "2026-05-04T16:00:00.000Z"
    ),
    post(
      "forum_gam_reply",
      "gam",
      "Welcome — post short clips under storytelling if you want line-by-line feedback.",
      "Aunty demo",
      "demo_gam_2",
      "2026-05-04T16:35:00.000Z",
      { parent_id: "forum_gam_welcome", root_id: "forum_gam_welcome", depth: 1, parent_post_id: "forum_gam_welcome" }
    ),
  ],
  kw: [
    post(
      "forum_kw_roots",
      "kw",
      "Looking for conversational Kernewek greetings beyond 'Myttyn da' — what do you actually say to neighbours?",
      "Pol Tre",
      "demo_kw_1",
      "2026-05-06T08:30:00.000Z"
    ),
    post(
      "forum_kw_reply",
      "kw",
      "Ha dewetha/Ha’n dons — depends on dialect; check the dialects page recordings.",
      "Mod Kernow demo",
      "demo_kw_mod",
      "2026-05-06T09:00:00.000Z",
      { parent_id: "forum_kw_roots", root_id: "forum_kw_roots", depth: 1, parent_post_id: "forum_kw_roots" }
    ),
  ],
  oj: [
    post(
      "forum_oj_land",
      "oj",
      "Sharing place-names around the Lakes — bilingual labels for signage projects. No sacred sites in this thread.",
      "Nookomis demo",
      "demo_oj_1",
      "2026-05-03T19:45:00.000Z"
    ),
    post(
      "forum_oj_child",
      "oj",
      "Could we sticky a moderator note on pronunciation for double-vowel length?",
      "Benji Z.",
      "demo_oj_2",
      "2026-05-06T21:05:00.000Z",
      { parent_id: "forum_oj_land", root_id: "forum_oj_land", depth: 1, parent_post_id: "forum_oj_land" }
    ),
    post(
      "forum_oj_standalone",
      "oj",
      "Flashcard decks from this archive slap — elders said hearing their own vowels replayed builds confidence 💚",
      "Skylar R.",
      "demo_oj_3",
      "2026-05-07T06:31:00.000Z"
    ),
  ],
};

/** Generic filler when Cloudant returns no forum rows */
function fallbackForumRaw(languageCode: string): RawForum[] {
  const lc = languageCode.toLowerCase();
  return [
    post(
      `forum_${lc}_seed_a`,
      lc,
      `Welcome to the ${lc.toUpperCase()} circle — introduce yourself with one sentence and your learning goal.`,
      "Archive seed",
      "demo_seed_a",
      "2026-05-07T09:05:32.124Z",
      { reactions: { "❤️": ["seed"] } }
    ),
    post(
      `forum_${lc}_seed_b`,
      lc,
      "Tip for beginners: skim the Dictionary tab with audio clips first — you’ll recognise repeat syllables.",
      "Archive seed",
      "demo_seed_b",
      "2026-05-06T07:52:41.089Z",
      { parent_id: null, root_id: null }
    ),
    post(
      `forum_${lc}_seed_c`,
      lc,
      "Agreed — and add missing words slowly so moderators get clean coverage stats.",
      "Learner collective",
      "demo_seed_c",
      "2026-05-06T08:41:51.089Z",
      {
        parent_id: `forum_${lc}_seed_b`,
        root_id: `forum_${lc}_seed_b`,
        depth: 1,
        parent_post_id: `forum_${lc}_seed_b`,
      }
    ),
  ];
}

/** Forum posts merged when Cloudant forum query fails or returns no active docs */
export function mockForumPostsForLanguage(languageCode: string): Post[] {
  const lc = languageCode.trim().toLowerCase();
  const raw = MOCK_FORUM_RAW[lc] ?? fallbackForumRaw(lc);
  return raw.map((r) =>
    normalizeForumPost({
      ...r,
      language_code: lc,
    })
  );
}
