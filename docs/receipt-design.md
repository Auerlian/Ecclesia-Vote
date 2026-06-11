# Receipt design — voter‑assembled receipts

> Status: v0.1 implements the assembly mechanism below with the MockEngine (PROTOTYPE). The
> commit‑reveal extension (§7) is v0.2 and requires the real engine. **Before any binding/real
> use, this construction must get an external cryptographic review** — we are deliberately
> departing from the proven systems (Helios/Belenios/ElectionGuard), so we hold ourselves to the
> same bar we'd hold them to.

## 1. Why the voter assembles the receipt

The hard problem in verifiable voting is not soundness — Helios, Belenios and ElectionGuard are
sound and almost unused for real decisions. It's **trust and adoption**. A code that "appears from
nowhere" asks the voter to trust math they can't see. Effort, ceremony and agency are how humans
calibrate trust (the booth, the paper ballot, the box are doing legitimacy work, not security
work). So we let the voter **assemble** their receipt — and it is aligned with this project's
Benaloh philosophy: *don't trust us, check us.*

The catch we must not get wrong: a receipt is published, so if the voter controls *publishable
bits*, those bits are a covert channel a coercer can demand (§0.1, §0.3). The design below gives
the voter the full ceremony while making their choice **cryptographically inert**.

## 2. The invariant (the whole design in one line)

> The voter chooses among forms that are all **equivalent encodings of a value the voter does not
> control**, and the board publishes the **canonical** value — never the specific form the voter
> picked.

Hold this and the choice carries no exclusive signal about the vote; break it (publish the pick,
or let the pick influence the value) and the channel returns. It is enforced as tests (§8), not a
comment.

## 3. Construction

A receipt has **6 slots**: 3 word slots + 3 number slots. Each slot offers **4 equivalent skins**;
the voter picks one per slot (6 picks — an effortful, keypad‑like ceremony).

- **Canonical value `V`** is derived from a system CSPRNG seed that is **independent of the vote**.
  `V` is 6 small integers (one *class* per slot): word classes in `[0,64)`, number classes in
  `[0,25)`.
- **Word slot `i`, class `c`:** the 4 skins are the 4 words `WORDLIST_i[4c … 4c+3]` of the existing
  256‑word list. They all **decode** to class `c` via `class(word) = ⌊index(word) / 4⌋`. The
  canonical word is the representative `WORDLIST_i[4c]`.
- **Number slot, class `c`:** the 4 skins are the 2‑digit codes `4c … 4c+3`; `class(n) = ⌊n/4⌋`;
  canonical is `4c` (zero‑padded).
- The 4 options are presented in a **seed‑shuffled order**, so "pick the first option" is
  meaningless (the position is per‑ballot random — your original point).

Because every skin in a slot decodes to the same class, **every one of the `4⁶ = 4096` pick
combinations canonicalizes to the same `V`.** The voter assembles a *skin* of a value the system
already fixed.

Canonical display: `word-word-word-NN-NN-NN` (e.g. `silver-stream-otter-20-44-08`).

## 4. What the board stores, and how the voter verifies

- The **board stores canonical `V`** (the representatives) — so every voter's board entry looks the
  same regardless of which skins they chose. There is **no per‑voter pattern** for a coercer to
  demand.
- The voter verifies by **searching their own skin**; the lookup canonicalizes the query
  (`canonicalizeReceipt`) and matches on `V`. So the voter still gets their personal "✓ my receipt
  is included" moment, on whatever form they remember.

## 5. Why it's coercion‑safe (and where it isn't)

- **Subliminal channel:** the voter's pick is over a vote‑independent `V`; the board shows `V`, not
  the pick. A coercer reading the board learns the voter's class‑value (random, vote‑independent),
  never the skin or the vote.
- **Equivocation / deniability:** all 4 skins per class are **publicly derivable from `V`**. So a
  coercer who demands "show me your words" gets a form the voter can produce for *any* class — the
  voter can present whichever skin satisfies any demanded predicate, regardless of how they voted.
  "Make your middle word a noun" is satisfiable by everyone and proves nothing.
- **Pre‑commitment coercion fails:** a coercer cannot pre‑assign a receipt, because the option sets
  are derived from a random seed unknown until the voter is in the booth.
- **Honest residual (human factors):** even a cryptographically meaningless choice could be treated
  as a lever by an unsophisticated coercer ("you must do X"). Publishing **canonical `V`, never the
  pick** removes the visible signal, which is the main mitigation; voter education (the practice
  flow) and clear copy are the rest. This residual is documented in `docs/threat-model.md`.

## 6. Entropy

Identifier entropy = `log2(64³ · 25³) ≈ 32 bits`. The voter's 6 picks add **0 bits** to `V`
(they're equivalent encodings — that's the point; voter‑*chosen* entropy would be biased and a
channel). 32 bits with a per‑election collision‑redraw is ample for organisational electorates;
the rate‑limited, inclusion‑only lookup bounds guessing. (If a deployment needs more, add slots —
the scheme is parameterised.)

## 7. v0.2 extension — "it wasn't pre‑assigned" via commit‑reveal

To answer "the code could have been pre‑recorded against me," let the voter contribute entropy that
neither side controls: server publishes a commitment `C = H(server_nonce)`, the voter contributes,
`seed = H(server_nonce, voter_contribution)`, and `server_nonce` is revealed so the voter can
confirm their contribution shaped `V`. **Open subtlety for review:** verifying the contribution
(needed for trust) is in tension with denying the input to a coercer (needed for receipt‑freeness)
— the central tension of the field. v0.2 designs this deliberately; v0.1 does not ship it.

## 8. Testable invariants (CI)

1. **Equivalence:** for a seed, *all 4096* pick combinations canonicalize to the same `V`.
2. **Decode round‑trip:** `canonicalize(canonical) === canonical` (idempotent); each skin decodes to
   its class.
3. **Derivability:** every skin is computable from `V` (no secret skins).
4. **Vote independence:** the seed/derivation takes no vote input (checked structurally — the
   function has no vote parameter).
5. **Board rule:** the published board value equals `V`, never the voter's chosen display form.

## 9. Messaging rule

Empowering *feeling*, true *claim*. The receipt proves a ballot is **counted**; secrecy and
integrity come from the engine. Ship copy like *"You helped seal your ballot. This receipt proves
it's counted — and it can't reveal how you voted."* — friendly, and it survives a hostile audit.
