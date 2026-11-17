import React from 'react';
import { Flower } from './Flower';
import { Bouquet, GardenCorner, PetalDrift, SunGlow } from './Botanical';
import { BigBranch, BigDaisy, BigFern, BigLeaf, BigSunflower, BigTulips } from './BigBotanicals';

type Kind =
    | 'flower' | 'flowerSoft' | 'daisy' | 'sunflower' | 'fern' | 'leaf' | 'tulips' | 'branch'
    | 'bouquet' | 'sun' | 'garden' | 'petals';

interface Item {
    kind: Kind;
    /** Position and size classes for the wrapper, e.g. '-right-16 -top-16 size-64'. */
    at: string;
    /** Overrides the default faintness. */
    opacity?: string;
}

const FAINT = 'opacity-40 dark:opacity-[0.14]';

const ART: Record<Kind, React.ReactNode> = {
    flower: <Flower petal="var(--blossom-soft)" center="var(--sun)" petals={7} rotate={-20} className="size-full" />,
    flowerSoft: <Flower petal="var(--leaf-soft)" center="var(--blossom-soft)" petals={5} rotate={12} className="size-full" />,
    daisy: <BigDaisy className="size-full" />,
    sunflower: <BigSunflower className="size-full" />,
    fern: <BigFern className="size-full" />,
    leaf: <BigLeaf className="size-full" />,
    tulips: <BigTulips className="size-full" />,
    branch: <BigBranch className="size-full" />,
    bouquet: <Bouquet className="size-full" />,
    sun: <SunGlow className="size-full" />,
    garden: <GardenCorner variant="blossom" className="size-full" />,
    petals: <PetalDrift className="w-full" />,
};

/** One mix per card so neighbours never repeat the same picture. */
const SETS = {
    hero: [{ kind: 'flowerSoft', at: '-left-16 -top-20 size-56 sm:size-72' }],
    heroData: [{ kind: 'sunflower', at: '-left-20 -bottom-24 size-56 sm:size-64', opacity: 'opacity-30 dark:opacity-[0.12]' }],
    rhythm: [
        { kind: 'branch', at: '-left-10 -top-12 size-48 sm:size-60' },
        { kind: 'tulips', at: '-right-6 -bottom-6 size-48 sm:size-64' },
    ],
    phase: [
        { kind: 'sun', at: '-right-12 -top-12 size-44 sm:size-56', opacity: 'opacity-60 dark:opacity-25' },
        { kind: 'leaf', at: '-left-16 -bottom-20 size-52 sm:size-64' },
    ],
    explorer: [
        { kind: 'daisy', at: '-right-16 -top-16 size-52 sm:size-64' },
        { kind: 'fern', at: '-left-6 -bottom-10 size-48 sm:size-60' },
    ],
    stats: [
        { kind: 'flower', at: '-right-16 -top-16 size-48 sm:size-56' },
        { kind: 'petals', at: 'left-6 bottom-4 w-24', opacity: 'opacity-50 dark:opacity-25' },
    ],
    weekly: [{ kind: 'bouquet', at: '-right-2 -bottom-3 h-28 w-32', opacity: 'opacity-35 dark:opacity-20' }],
    explore: [
        { kind: 'garden', at: 'right-0 bottom-0 size-40', opacity: 'opacity-45 dark:opacity-20' },
        { kind: 'daisy', at: '-left-14 -top-14 size-40' },
    ],
    pregnancy: [
        { kind: 'tulips', at: '-right-4 -bottom-6 size-48 sm:size-60' },
        { kind: 'flowerSoft', at: '-left-16 -top-16 size-44' },
    ],
    fertility: [{ kind: 'branch', at: '-right-8 -bottom-10 size-44 sm:size-52' }],
} satisfies Record<string, Item[]>;

/**
 * Large faint illustrations cropped by a card's edges: the app's flower doodles, the
 * Botanical set and the big pieces in BigBotanicals. The card needs
 * `relative isolate overflow-hidden`: the art sits at z -1, above the card background
 * and below its content, so the content needs no extra wrapper.
 */
export const CardFlowers: React.FC<{ variant: keyof typeof SETS }> = ({ variant }) => (
    <>
        {(SETS[variant] as Item[]).map((item, i) => (
            <div key={i} aria-hidden="true" className={`pointer-events-none absolute -z-10 ${item.at} ${item.opacity ?? FAINT}`}>
                {ART[item.kind]}
            </div>
        ))}
    </>
);
