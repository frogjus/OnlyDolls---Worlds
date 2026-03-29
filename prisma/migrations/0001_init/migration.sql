-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "WorldRole" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "emailVerified" TIMESTAMP(3),
    "avatarUrl" TEXT,
    "bio" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorldMembership" (
    "id" TEXT NOT NULL,
    "role" "WorldRole" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "storyWorldId" TEXT NOT NULL,

    CONSTRAINT "WorldMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "storyWorldId" TEXT NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Annotation" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "body" TEXT,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "anchor" JSONB,
    "color" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "storyWorldId" TEXT NOT NULL,

    CONSTRAINT "Annotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "storyWorldId" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryWorld" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "genre" TEXT,
    "logline" TEXT,
    "coverUrl" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "embedding" vector(1536),
    "searchBody" tsvector,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "StoryWorld_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT,
    "backstory" TEXT,
    "physicalDesc" TEXT,
    "psychProfile" TEXT,
    "archetype" TEXT,
    "goals" JSONB NOT NULL DEFAULT '[]',
    "traits" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "embedding" vector(1536),
    "searchBody" tsvector,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "storyWorldId" TEXT NOT NULL,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterSceneRole" (
    "id" TEXT NOT NULL,
    "roleType" TEXT NOT NULL,
    "actant" TEXT,
    "notes" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "characterId" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,

    CONSTRAINT "CharacterSceneRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fabulaPosition" DOUBLE PRECISION,
    "fabulaDate" TEXT,
    "isKeyEvent" BOOLEAN NOT NULL DEFAULT false,
    "causalPreconditions" JSONB NOT NULL DEFAULT '[]',
    "consequences" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "embedding" vector(1536),
    "searchBody" tsvector,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "storyWorldId" TEXT NOT NULL,
    "locationId" TEXT,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventParticipant" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'participant',
    "eventId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,

    CONSTRAINT "EventParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scene" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT,
    "sjuzhetPosition" DOUBLE PRECISION,
    "purpose" TEXT,
    "tone" TEXT,
    "polarity" TEXT,
    "wordCountTarget" INTEGER,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "embedding" vector(1536),
    "searchBody" tsvector,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "storyWorldId" TEXT NOT NULL,
    "eventId" TEXT,
    "locationId" TEXT,
    "beatId" TEXT,
    "sequenceId" TEXT,
    "actId" TEXT,

    CONSTRAINT "Scene_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SceneCharacter" (
    "id" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,

    CONSTRAINT "SceneCharacter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Beat" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "position" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "color" TEXT,
    "starRating" INTEGER,
    "notes" TEXT,
    "treatmentOverride" TEXT,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "storyWorldId" TEXT NOT NULL,
    "sequenceId" TEXT,
    "characterId" TEXT,

    CONSTRAINT "Beat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sequence" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "position" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "storyWorldId" TEXT NOT NULL,
    "actId" TEXT,

    CONSTRAINT "Sequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Act" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "position" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "storyWorldId" TEXT NOT NULL,

    CONSTRAINT "Act_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT,
    "parentId" TEXT,
    "coordinates" JSONB,
    "properties" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "storyWorldId" TEXT NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_object" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT,
    "significance" TEXT,
    "properties" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "storyWorldId" TEXT NOT NULL,

    CONSTRAINT "story_object_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Theme" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "thesis" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "storyWorldId" TEXT NOT NULL,

    CONSTRAINT "Theme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Motif" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT,
    "occurrences" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "storyWorldId" TEXT NOT NULL,

    CONSTRAINT "Motif_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theme_motif" (
    "id" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "motifId" TEXT NOT NULL,

    CONSTRAINT "theme_motif_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faction" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT,
    "goals" JSONB NOT NULL DEFAULT '[]',
    "resources" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "storyWorldId" TEXT NOT NULL,

    CONSTRAINT "Faction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FactionMember" (
    "id" TEXT NOT NULL,
    "role" TEXT,
    "joinedAt" TEXT,
    "leftAt" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "factionId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,

    CONSTRAINT "FactionMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Relationship" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subtype" TEXT,
    "intensity" DOUBLE PRECISION,
    "description" TEXT,
    "bidirectional" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "storyWorldId" TEXT NOT NULL,
    "character1Id" TEXT NOT NULL,
    "character2Id" TEXT NOT NULL,
    "validFromEventId" TEXT,
    "validToEventId" TEXT,

    CONSTRAINT "Relationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceMaterial" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT,
    "author" TEXT,
    "url" TEXT,
    "content" TEXT,
    "notes" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "embedding" vector(1536),
    "searchBody" tsvector,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "storyWorldId" TEXT NOT NULL,

    CONSTRAINT "SourceMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FabulaTimeline" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "storyWorldId" TEXT NOT NULL,

    CONSTRAINT "FabulaTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FabulaTimelineEvent" (
    "id" TEXT NOT NULL,
    "position" DOUBLE PRECISION NOT NULL,
    "fabulaTimelineId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,

    CONSTRAINT "FabulaTimelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SjuzhetTimeline" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "storyWorldId" TEXT NOT NULL,

    CONSTRAINT "SjuzhetTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SjuzhetTimelineEvent" (
    "id" TEXT NOT NULL,
    "position" DOUBLE PRECISION NOT NULL,
    "sjuzhetTimelineId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,

    CONSTRAINT "SjuzhetTimelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StructureTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "source" TEXT,
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "storyWorldId" TEXT,

    CONSTRAINT "StructureTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StructureBeat" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "position" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "percentStart" DOUBLE PRECISION,
    "percentEnd" DOUBLE PRECISION,
    "parentBeatId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "structureTemplateId" TEXT NOT NULL,

    CONSTRAINT "StructureBeat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StructureMapping" (
    "id" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "notes" TEXT,
    "confidence" DOUBLE PRECISION,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "storyWorldId" TEXT NOT NULL,
    "structureTemplateId" TEXT NOT NULL,
    "structureBeatId" TEXT NOT NULL,

    CONSTRAINT "StructureMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Arc" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'character',
    "description" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "storyWorldId" TEXT NOT NULL,
    "characterId" TEXT,

    CONSTRAINT "Arc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArcPhase" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "position" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "state" TEXT,
    "targetType" TEXT,
    "targetId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "arcId" TEXT NOT NULL,

    CONSTRAINT "ArcPhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanonSnapshot" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "snapshotAt" TEXT,
    "state" JSONB NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'full',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "storyWorldId" TEXT NOT NULL,
    "eventId" TEXT,

    CONSTRAINT "CanonSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "divergence" TEXT,
    "state" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "storyWorldId" TEXT NOT NULL,
    "canonSnapshotId" TEXT NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValueChange" (
    "id" TEXT NOT NULL,
    "valueName" TEXT NOT NULL,
    "fromState" TEXT NOT NULL,
    "toState" TEXT NOT NULL,
    "magnitude" DOUBLE PRECISION,
    "notes" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "storyWorldId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,

    CONSTRAINT "ValueChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NarrativeCode" (
    "id" TEXT NOT NULL,
    "codeType" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "storyWorldId" TEXT NOT NULL,
    "sceneId" TEXT,

    CONSTRAINT "NarrativeCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enigma" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "posedAt" TEXT,
    "posedAtType" TEXT,
    "resolvedAt" TEXT,
    "resolvedAtType" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "storyWorldId" TEXT NOT NULL,

    CONSTRAINT "Enigma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SetupPayoff" (
    "id" TEXT NOT NULL,
    "description" TEXT,
    "setupType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planted',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "storyWorldId" TEXT NOT NULL,
    "setupSceneId" TEXT NOT NULL,
    "payoffSceneId" TEXT,

    CONSTRAINT "SetupPayoff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThematicOpposition" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "storyWorldId" TEXT NOT NULL,
    "themeAId" TEXT NOT NULL,
    "themeBId" TEXT NOT NULL,

    CONSTRAINT "ThematicOpposition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PacingMetric" (
    "id" TEXT NOT NULL,
    "tension" DOUBLE PRECISION,
    "informationRate" DOUBLE PRECISION,
    "dialogueDensity" DOUBLE PRECISION,
    "actionDensity" DOUBLE PRECISION,
    "wordCount" INTEGER,
    "estimatedDuration" DOUBLE PRECISION,
    "notes" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "storyWorldId" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,

    CONSTRAINT "PacingMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmotionalState" (
    "id" TEXT NOT NULL,
    "emotion" TEXT NOT NULL,
    "intensity" DOUBLE PRECISION,
    "valence" DOUBLE PRECISION,
    "arousal" DOUBLE PRECISION,
    "trigger" TEXT,
    "targetType" TEXT,
    "targetId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "storyWorldId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,

    CONSTRAINT "EmotionalState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CausalRelation" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'causes',
    "strength" DOUBLE PRECISION,
    "description" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "storyWorldId" TEXT NOT NULL,
    "causeEventId" TEXT NOT NULL,
    "effectEventId" TEXT NOT NULL,

    CONSTRAINT "CausalRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceProfile" (
    "id" TEXT NOT NULL,
    "register" TEXT,
    "vocabulary" JSONB NOT NULL DEFAULT '{}',
    "sentenceStyle" TEXT,
    "dialect" TEXT,
    "speechExamples" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "storyWorldId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,

    CONSTRAINT "VoiceProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudienceKnowledge" (
    "id" TEXT NOT NULL,
    "fact" TEXT NOT NULL,
    "audienceKnows" BOOLEAN NOT NULL DEFAULT false,
    "characterKnows" BOOLEAN NOT NULL DEFAULT false,
    "revealedAtType" TEXT,
    "revealedAtId" TEXT,
    "dramaticIrony" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "storyWorldId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,

    CONSTRAINT "AudienceKnowledge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarSystem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "epochName" TEXT,
    "daysInYear" INTEGER,
    "monthNames" JSONB NOT NULL DEFAULT '[]',
    "rules" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "storyWorldId" TEXT NOT NULL,

    CONSTRAINT "CalendarSystem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MagicSystem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT,
    "source" TEXT,
    "limitations" JSONB NOT NULL DEFAULT '[]',
    "costs" JSONB NOT NULL DEFAULT '[]',
    "rules" JSONB NOT NULL DEFAULT '[]',
    "practitioners" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "storyWorldId" TEXT NOT NULL,

    CONSTRAINT "MagicSystem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorldRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "scope" TEXT,
    "exceptions" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "storyWorldId" TEXT NOT NULL,

    CONSTRAINT "WorldRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Narrator" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "reliability" DOUBLE PRECISION,
    "description" TEXT,
    "voiceNotes" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "storyWorldId" TEXT NOT NULL,

    CONSTRAINT "Narrator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Focalization" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "notes" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "storyWorldId" TEXT NOT NULL,
    "narratorId" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,

    CONSTRAINT "Focalization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NarrativeLevel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "parentId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "storyWorldId" TEXT NOT NULL,

    CONSTRAINT "NarrativeLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenreType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "conventions" JSONB NOT NULL DEFAULT '[]',
    "description" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "storyWorldId" TEXT NOT NULL,

    CONSTRAINT "GenreType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryPattern" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "description" TEXT,
    "examples" JSONB NOT NULL DEFAULT '[]',
    "targetType" TEXT,
    "targetId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "storyWorldId" TEXT NOT NULL,

    CONSTRAINT "StoryPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Manuscript" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'novel',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "targetWordCount" INTEGER,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "searchBody" tsvector,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "storyWorldId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "Manuscript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManuscriptSection" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "type" TEXT NOT NULL DEFAULT 'chapter',
    "position" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "content" TEXT,
    "wordCount" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "searchBody" tsvector,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "manuscriptId" TEXT NOT NULL,
    "sceneId" TEXT,
    "parentId" TEXT,

    CONSTRAINT "ManuscriptSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Treatment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'synopsis',
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "searchBody" tsvector,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "storyWorldId" TEXT NOT NULL,

    CONSTRAINT "Treatment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "WorldMembership_storyWorldId_idx" ON "WorldMembership"("storyWorldId");

-- CreateIndex
CREATE INDEX "WorldMembership_userId_idx" ON "WorldMembership"("userId");

-- CreateIndex
CREATE INDEX "WorldMembership_deletedAt_idx" ON "WorldMembership"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorldMembership_userId_storyWorldId_key" ON "WorldMembership"("userId", "storyWorldId");

-- CreateIndex
CREATE INDEX "Comment_targetType_targetId_idx" ON "Comment"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "Comment_storyWorldId_idx" ON "Comment"("storyWorldId");

-- CreateIndex
CREATE INDEX "Comment_userId_idx" ON "Comment"("userId");

-- CreateIndex
CREATE INDEX "Comment_deletedAt_idx" ON "Comment"("deletedAt");

-- CreateIndex
CREATE INDEX "Annotation_targetType_targetId_idx" ON "Annotation"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "Annotation_storyWorldId_idx" ON "Annotation"("storyWorldId");

-- CreateIndex
CREATE INDEX "Annotation_deletedAt_idx" ON "Annotation"("deletedAt");

-- CreateIndex
CREATE INDEX "Tag_targetType_targetId_idx" ON "Tag"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "Tag_storyWorldId_name_idx" ON "Tag"("storyWorldId", "name");

-- CreateIndex
CREATE INDEX "Tag_deletedAt_idx" ON "Tag"("deletedAt");

-- CreateIndex
CREATE INDEX "StoryWorld_ownerId_idx" ON "StoryWorld"("ownerId");

-- CreateIndex
CREATE INDEX "StoryWorld_deletedAt_idx" ON "StoryWorld"("deletedAt");

-- CreateIndex
CREATE INDEX "Character_storyWorldId_idx" ON "Character"("storyWorldId");

-- CreateIndex
CREATE INDEX "Character_name_idx" ON "Character"("name");

-- CreateIndex
CREATE INDEX "Character_deletedAt_idx" ON "Character"("deletedAt");

-- CreateIndex
CREATE INDEX "CharacterSceneRole_sceneId_idx" ON "CharacterSceneRole"("sceneId");

-- CreateIndex
CREATE INDEX "CharacterSceneRole_characterId_idx" ON "CharacterSceneRole"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterSceneRole_characterId_sceneId_key" ON "CharacterSceneRole"("characterId", "sceneId");

-- CreateIndex
CREATE INDEX "Event_storyWorldId_idx" ON "Event"("storyWorldId");

-- CreateIndex
CREATE INDEX "Event_fabulaPosition_idx" ON "Event"("fabulaPosition");

-- CreateIndex
CREATE INDEX "Event_deletedAt_idx" ON "Event"("deletedAt");

-- CreateIndex
CREATE INDEX "EventParticipant_characterId_idx" ON "EventParticipant"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "EventParticipant_eventId_characterId_key" ON "EventParticipant"("eventId", "characterId");

-- CreateIndex
CREATE INDEX "Scene_storyWorldId_idx" ON "Scene"("storyWorldId");

-- CreateIndex
CREATE INDEX "Scene_sjuzhetPosition_idx" ON "Scene"("sjuzhetPosition");

-- CreateIndex
CREATE INDEX "Scene_eventId_idx" ON "Scene"("eventId");

-- CreateIndex
CREATE INDEX "Scene_beatId_idx" ON "Scene"("beatId");

-- CreateIndex
CREATE INDEX "Scene_sequenceId_idx" ON "Scene"("sequenceId");

-- CreateIndex
CREATE INDEX "Scene_actId_idx" ON "Scene"("actId");

-- CreateIndex
CREATE INDEX "Scene_deletedAt_idx" ON "Scene"("deletedAt");

-- CreateIndex
CREATE INDEX "SceneCharacter_characterId_idx" ON "SceneCharacter"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "SceneCharacter_sceneId_characterId_key" ON "SceneCharacter"("sceneId", "characterId");

-- CreateIndex
CREATE INDEX "Beat_storyWorldId_idx" ON "Beat"("storyWorldId");

-- CreateIndex
CREATE INDEX "Beat_sequenceId_idx" ON "Beat"("sequenceId");

-- CreateIndex
CREATE INDEX "Beat_characterId_idx" ON "Beat"("characterId");

-- CreateIndex
CREATE INDEX "Beat_position_idx" ON "Beat"("position");

-- CreateIndex
CREATE INDEX "Beat_deletedAt_idx" ON "Beat"("deletedAt");

-- CreateIndex
CREATE INDEX "Sequence_storyWorldId_idx" ON "Sequence"("storyWorldId");

-- CreateIndex
CREATE INDEX "Sequence_actId_idx" ON "Sequence"("actId");

-- CreateIndex
CREATE INDEX "Sequence_position_idx" ON "Sequence"("position");

-- CreateIndex
CREATE INDEX "Sequence_deletedAt_idx" ON "Sequence"("deletedAt");

-- CreateIndex
CREATE INDEX "Act_storyWorldId_idx" ON "Act"("storyWorldId");

-- CreateIndex
CREATE INDEX "Act_position_idx" ON "Act"("position");

-- CreateIndex
CREATE INDEX "Act_deletedAt_idx" ON "Act"("deletedAt");

-- CreateIndex
CREATE INDEX "Location_storyWorldId_idx" ON "Location"("storyWorldId");

-- CreateIndex
CREATE INDEX "Location_parentId_idx" ON "Location"("parentId");

-- CreateIndex
CREATE INDEX "Location_deletedAt_idx" ON "Location"("deletedAt");

-- CreateIndex
CREATE INDEX "story_object_storyWorldId_idx" ON "story_object"("storyWorldId");

-- CreateIndex
CREATE INDEX "story_object_deletedAt_idx" ON "story_object"("deletedAt");

-- CreateIndex
CREATE INDEX "Theme_storyWorldId_idx" ON "Theme"("storyWorldId");

-- CreateIndex
CREATE INDEX "Theme_deletedAt_idx" ON "Theme"("deletedAt");

-- CreateIndex
CREATE INDEX "Motif_storyWorldId_idx" ON "Motif"("storyWorldId");

-- CreateIndex
CREATE INDEX "Motif_deletedAt_idx" ON "Motif"("deletedAt");

-- CreateIndex
CREATE INDEX "theme_motif_motifId_idx" ON "theme_motif"("motifId");

-- CreateIndex
CREATE UNIQUE INDEX "theme_motif_themeId_motifId_key" ON "theme_motif"("themeId", "motifId");

-- CreateIndex
CREATE INDEX "Faction_storyWorldId_idx" ON "Faction"("storyWorldId");

-- CreateIndex
CREATE INDEX "Faction_deletedAt_idx" ON "Faction"("deletedAt");

-- CreateIndex
CREATE INDEX "FactionMember_characterId_idx" ON "FactionMember"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "FactionMember_factionId_characterId_key" ON "FactionMember"("factionId", "characterId");

-- CreateIndex
CREATE INDEX "Relationship_storyWorldId_idx" ON "Relationship"("storyWorldId");

-- CreateIndex
CREATE INDEX "Relationship_character1Id_idx" ON "Relationship"("character1Id");

-- CreateIndex
CREATE INDEX "Relationship_character2Id_idx" ON "Relationship"("character2Id");

-- CreateIndex
CREATE INDEX "Relationship_validFromEventId_idx" ON "Relationship"("validFromEventId");

-- CreateIndex
CREATE INDEX "Relationship_validToEventId_idx" ON "Relationship"("validToEventId");

-- CreateIndex
CREATE INDEX "Relationship_type_idx" ON "Relationship"("type");

-- CreateIndex
CREATE INDEX "Relationship_deletedAt_idx" ON "Relationship"("deletedAt");

-- CreateIndex
CREATE INDEX "SourceMaterial_storyWorldId_idx" ON "SourceMaterial"("storyWorldId");

-- CreateIndex
CREATE INDEX "SourceMaterial_deletedAt_idx" ON "SourceMaterial"("deletedAt");

-- CreateIndex
CREATE INDEX "FabulaTimeline_storyWorldId_idx" ON "FabulaTimeline"("storyWorldId");

-- CreateIndex
CREATE INDEX "FabulaTimeline_deletedAt_idx" ON "FabulaTimeline"("deletedAt");

-- CreateIndex
CREATE INDEX "FabulaTimelineEvent_eventId_idx" ON "FabulaTimelineEvent"("eventId");

-- CreateIndex
CREATE INDEX "FabulaTimelineEvent_fabulaTimelineId_position_idx" ON "FabulaTimelineEvent"("fabulaTimelineId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "FabulaTimelineEvent_fabulaTimelineId_eventId_key" ON "FabulaTimelineEvent"("fabulaTimelineId", "eventId");

-- CreateIndex
CREATE INDEX "SjuzhetTimeline_storyWorldId_idx" ON "SjuzhetTimeline"("storyWorldId");

-- CreateIndex
CREATE INDEX "SjuzhetTimeline_deletedAt_idx" ON "SjuzhetTimeline"("deletedAt");

-- CreateIndex
CREATE INDEX "SjuzhetTimelineEvent_eventId_idx" ON "SjuzhetTimelineEvent"("eventId");

-- CreateIndex
CREATE INDEX "SjuzhetTimelineEvent_sjuzhetTimelineId_position_idx" ON "SjuzhetTimelineEvent"("sjuzhetTimelineId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "SjuzhetTimelineEvent_sjuzhetTimelineId_eventId_key" ON "SjuzhetTimelineEvent"("sjuzhetTimelineId", "eventId");

-- CreateIndex
CREATE INDEX "StructureTemplate_storyWorldId_idx" ON "StructureTemplate"("storyWorldId");

-- CreateIndex
CREATE INDEX "StructureTemplate_deletedAt_idx" ON "StructureTemplate"("deletedAt");

-- CreateIndex
CREATE INDEX "StructureBeat_structureTemplateId_idx" ON "StructureBeat"("structureTemplateId");

-- CreateIndex
CREATE INDEX "StructureBeat_parentBeatId_idx" ON "StructureBeat"("parentBeatId");

-- CreateIndex
CREATE INDEX "StructureBeat_position_idx" ON "StructureBeat"("position");

-- CreateIndex
CREATE INDEX "StructureMapping_storyWorldId_idx" ON "StructureMapping"("storyWorldId");

-- CreateIndex
CREATE INDEX "StructureMapping_targetType_targetId_idx" ON "StructureMapping"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "StructureMapping_structureTemplateId_idx" ON "StructureMapping"("structureTemplateId");

-- CreateIndex
CREATE INDEX "StructureMapping_structureBeatId_idx" ON "StructureMapping"("structureBeatId");

-- CreateIndex
CREATE INDEX "Arc_storyWorldId_idx" ON "Arc"("storyWorldId");

-- CreateIndex
CREATE INDEX "Arc_characterId_idx" ON "Arc"("characterId");

-- CreateIndex
CREATE INDEX "Arc_deletedAt_idx" ON "Arc"("deletedAt");

-- CreateIndex
CREATE INDEX "ArcPhase_arcId_idx" ON "ArcPhase"("arcId");

-- CreateIndex
CREATE INDEX "ArcPhase_position_idx" ON "ArcPhase"("position");

-- CreateIndex
CREATE INDEX "ArcPhase_targetType_targetId_idx" ON "ArcPhase"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "CanonSnapshot_storyWorldId_idx" ON "CanonSnapshot"("storyWorldId");

-- CreateIndex
CREATE INDEX "CanonSnapshot_deletedAt_idx" ON "CanonSnapshot"("deletedAt");

-- CreateIndex
CREATE INDEX "Branch_storyWorldId_idx" ON "Branch"("storyWorldId");

-- CreateIndex
CREATE INDEX "Branch_canonSnapshotId_idx" ON "Branch"("canonSnapshotId");

-- CreateIndex
CREATE INDEX "Branch_deletedAt_idx" ON "Branch"("deletedAt");

-- CreateIndex
CREATE INDEX "ValueChange_storyWorldId_idx" ON "ValueChange"("storyWorldId");

-- CreateIndex
CREATE INDEX "ValueChange_eventId_idx" ON "ValueChange"("eventId");

-- CreateIndex
CREATE INDEX "ValueChange_valueName_idx" ON "ValueChange"("valueName");

-- CreateIndex
CREATE INDEX "NarrativeCode_storyWorldId_idx" ON "NarrativeCode"("storyWorldId");

-- CreateIndex
CREATE INDEX "NarrativeCode_codeType_idx" ON "NarrativeCode"("codeType");

-- CreateIndex
CREATE INDEX "NarrativeCode_targetType_targetId_idx" ON "NarrativeCode"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "NarrativeCode_sceneId_idx" ON "NarrativeCode"("sceneId");

-- CreateIndex
CREATE INDEX "Enigma_storyWorldId_idx" ON "Enigma"("storyWorldId");

-- CreateIndex
CREATE INDEX "Enigma_status_idx" ON "Enigma"("status");

-- CreateIndex
CREATE INDEX "SetupPayoff_storyWorldId_idx" ON "SetupPayoff"("storyWorldId");

-- CreateIndex
CREATE INDEX "SetupPayoff_setupSceneId_idx" ON "SetupPayoff"("setupSceneId");

-- CreateIndex
CREATE INDEX "SetupPayoff_payoffSceneId_idx" ON "SetupPayoff"("payoffSceneId");

-- CreateIndex
CREATE INDEX "SetupPayoff_status_idx" ON "SetupPayoff"("status");

-- CreateIndex
CREATE INDEX "ThematicOpposition_storyWorldId_idx" ON "ThematicOpposition"("storyWorldId");

-- CreateIndex
CREATE INDEX "ThematicOpposition_themeAId_idx" ON "ThematicOpposition"("themeAId");

-- CreateIndex
CREATE INDEX "ThematicOpposition_themeBId_idx" ON "ThematicOpposition"("themeBId");

-- CreateIndex
CREATE INDEX "PacingMetric_storyWorldId_idx" ON "PacingMetric"("storyWorldId");

-- CreateIndex
CREATE INDEX "PacingMetric_sceneId_idx" ON "PacingMetric"("sceneId");

-- CreateIndex
CREATE INDEX "EmotionalState_storyWorldId_idx" ON "EmotionalState"("storyWorldId");

-- CreateIndex
CREATE INDEX "EmotionalState_characterId_idx" ON "EmotionalState"("characterId");

-- CreateIndex
CREATE INDEX "EmotionalState_targetType_targetId_idx" ON "EmotionalState"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "CausalRelation_storyWorldId_idx" ON "CausalRelation"("storyWorldId");

-- CreateIndex
CREATE INDEX "CausalRelation_causeEventId_idx" ON "CausalRelation"("causeEventId");

-- CreateIndex
CREATE INDEX "CausalRelation_effectEventId_idx" ON "CausalRelation"("effectEventId");

-- CreateIndex
CREATE INDEX "VoiceProfile_storyWorldId_idx" ON "VoiceProfile"("storyWorldId");

-- CreateIndex
CREATE INDEX "VoiceProfile_characterId_idx" ON "VoiceProfile"("characterId");

-- CreateIndex
CREATE INDEX "AudienceKnowledge_storyWorldId_idx" ON "AudienceKnowledge"("storyWorldId");

-- CreateIndex
CREATE INDEX "AudienceKnowledge_characterId_idx" ON "AudienceKnowledge"("characterId");

-- CreateIndex
CREATE INDEX "AudienceKnowledge_revealedAtType_revealedAtId_idx" ON "AudienceKnowledge"("revealedAtType", "revealedAtId");

-- CreateIndex
CREATE INDEX "CalendarSystem_storyWorldId_idx" ON "CalendarSystem"("storyWorldId");

-- CreateIndex
CREATE INDEX "CalendarSystem_deletedAt_idx" ON "CalendarSystem"("deletedAt");

-- CreateIndex
CREATE INDEX "MagicSystem_storyWorldId_idx" ON "MagicSystem"("storyWorldId");

-- CreateIndex
CREATE INDEX "MagicSystem_deletedAt_idx" ON "MagicSystem"("deletedAt");

-- CreateIndex
CREATE INDEX "WorldRule_storyWorldId_idx" ON "WorldRule"("storyWorldId");

-- CreateIndex
CREATE INDEX "WorldRule_category_idx" ON "WorldRule"("category");

-- CreateIndex
CREATE INDEX "WorldRule_deletedAt_idx" ON "WorldRule"("deletedAt");

-- CreateIndex
CREATE INDEX "Narrator_storyWorldId_idx" ON "Narrator"("storyWorldId");

-- CreateIndex
CREATE INDEX "Narrator_deletedAt_idx" ON "Narrator"("deletedAt");

-- CreateIndex
CREATE INDEX "Focalization_storyWorldId_idx" ON "Focalization"("storyWorldId");

-- CreateIndex
CREATE INDEX "Focalization_narratorId_idx" ON "Focalization"("narratorId");

-- CreateIndex
CREATE INDEX "Focalization_sceneId_idx" ON "Focalization"("sceneId");

-- CreateIndex
CREATE INDEX "NarrativeLevel_storyWorldId_idx" ON "NarrativeLevel"("storyWorldId");

-- CreateIndex
CREATE INDEX "NarrativeLevel_parentId_idx" ON "NarrativeLevel"("parentId");

-- CreateIndex
CREATE INDEX "NarrativeLevel_deletedAt_idx" ON "NarrativeLevel"("deletedAt");

-- CreateIndex
CREATE INDEX "GenreType_storyWorldId_idx" ON "GenreType"("storyWorldId");

-- CreateIndex
CREATE INDEX "GenreType_deletedAt_idx" ON "GenreType"("deletedAt");

-- CreateIndex
CREATE INDEX "StoryPattern_storyWorldId_idx" ON "StoryPattern"("storyWorldId");

-- CreateIndex
CREATE INDEX "StoryPattern_targetType_targetId_idx" ON "StoryPattern"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "StoryPattern_deletedAt_idx" ON "StoryPattern"("deletedAt");

-- CreateIndex
CREATE INDEX "Manuscript_storyWorldId_idx" ON "Manuscript"("storyWorldId");

-- CreateIndex
CREATE INDEX "Manuscript_authorId_idx" ON "Manuscript"("authorId");

-- CreateIndex
CREATE INDEX "Manuscript_deletedAt_idx" ON "Manuscript"("deletedAt");

-- CreateIndex
CREATE INDEX "ManuscriptSection_manuscriptId_idx" ON "ManuscriptSection"("manuscriptId");

-- CreateIndex
CREATE INDEX "ManuscriptSection_parentId_idx" ON "ManuscriptSection"("parentId");

-- CreateIndex
CREATE INDEX "ManuscriptSection_sceneId_idx" ON "ManuscriptSection"("sceneId");

-- CreateIndex
CREATE INDEX "ManuscriptSection_position_idx" ON "ManuscriptSection"("position");

-- CreateIndex
CREATE INDEX "ManuscriptSection_deletedAt_idx" ON "ManuscriptSection"("deletedAt");

-- CreateIndex
CREATE INDEX "Treatment_storyWorldId_idx" ON "Treatment"("storyWorldId");

-- CreateIndex
CREATE INDEX "Treatment_level_idx" ON "Treatment"("level");

-- CreateIndex
CREATE INDEX "Treatment_deletedAt_idx" ON "Treatment"("deletedAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorldMembership" ADD CONSTRAINT "WorldMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorldMembership" ADD CONSTRAINT "WorldMembership_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Annotation" ADD CONSTRAINT "Annotation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Annotation" ADD CONSTRAINT "Annotation_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryWorld" ADD CONSTRAINT "StoryWorld_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterSceneRole" ADD CONSTRAINT "CharacterSceneRole_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterSceneRole" ADD CONSTRAINT "CharacterSceneRole_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventParticipant" ADD CONSTRAINT "EventParticipant_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventParticipant" ADD CONSTRAINT "EventParticipant_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scene" ADD CONSTRAINT "Scene_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scene" ADD CONSTRAINT "Scene_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scene" ADD CONSTRAINT "Scene_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scene" ADD CONSTRAINT "Scene_beatId_fkey" FOREIGN KEY ("beatId") REFERENCES "Beat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scene" ADD CONSTRAINT "Scene_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "Sequence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scene" ADD CONSTRAINT "Scene_actId_fkey" FOREIGN KEY ("actId") REFERENCES "Act"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneCharacter" ADD CONSTRAINT "SceneCharacter_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneCharacter" ADD CONSTRAINT "SceneCharacter_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Beat" ADD CONSTRAINT "Beat_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Beat" ADD CONSTRAINT "Beat_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "Sequence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Beat" ADD CONSTRAINT "Beat_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sequence" ADD CONSTRAINT "Sequence_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sequence" ADD CONSTRAINT "Sequence_actId_fkey" FOREIGN KEY ("actId") REFERENCES "Act"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Act" ADD CONSTRAINT "Act_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_object" ADD CONSTRAINT "story_object_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Theme" ADD CONSTRAINT "Theme_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Motif" ADD CONSTRAINT "Motif_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_motif" ADD CONSTRAINT "theme_motif_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_motif" ADD CONSTRAINT "theme_motif_motifId_fkey" FOREIGN KEY ("motifId") REFERENCES "Motif"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Faction" ADD CONSTRAINT "Faction_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactionMember" ADD CONSTRAINT "FactionMember_factionId_fkey" FOREIGN KEY ("factionId") REFERENCES "Faction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactionMember" ADD CONSTRAINT "FactionMember_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_character1Id_fkey" FOREIGN KEY ("character1Id") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_character2Id_fkey" FOREIGN KEY ("character2Id") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_validFromEventId_fkey" FOREIGN KEY ("validFromEventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_validToEventId_fkey" FOREIGN KEY ("validToEventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceMaterial" ADD CONSTRAINT "SourceMaterial_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FabulaTimeline" ADD CONSTRAINT "FabulaTimeline_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FabulaTimelineEvent" ADD CONSTRAINT "FabulaTimelineEvent_fabulaTimelineId_fkey" FOREIGN KEY ("fabulaTimelineId") REFERENCES "FabulaTimeline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FabulaTimelineEvent" ADD CONSTRAINT "FabulaTimelineEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SjuzhetTimeline" ADD CONSTRAINT "SjuzhetTimeline_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SjuzhetTimelineEvent" ADD CONSTRAINT "SjuzhetTimelineEvent_sjuzhetTimelineId_fkey" FOREIGN KEY ("sjuzhetTimelineId") REFERENCES "SjuzhetTimeline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SjuzhetTimelineEvent" ADD CONSTRAINT "SjuzhetTimelineEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureTemplate" ADD CONSTRAINT "StructureTemplate_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureBeat" ADD CONSTRAINT "StructureBeat_parentBeatId_fkey" FOREIGN KEY ("parentBeatId") REFERENCES "StructureBeat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureBeat" ADD CONSTRAINT "StructureBeat_structureTemplateId_fkey" FOREIGN KEY ("structureTemplateId") REFERENCES "StructureTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureMapping" ADD CONSTRAINT "StructureMapping_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureMapping" ADD CONSTRAINT "StructureMapping_structureTemplateId_fkey" FOREIGN KEY ("structureTemplateId") REFERENCES "StructureTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureMapping" ADD CONSTRAINT "StructureMapping_structureBeatId_fkey" FOREIGN KEY ("structureBeatId") REFERENCES "StructureBeat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Arc" ADD CONSTRAINT "Arc_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Arc" ADD CONSTRAINT "Arc_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArcPhase" ADD CONSTRAINT "ArcPhase_arcId_fkey" FOREIGN KEY ("arcId") REFERENCES "Arc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanonSnapshot" ADD CONSTRAINT "CanonSnapshot_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_canonSnapshotId_fkey" FOREIGN KEY ("canonSnapshotId") REFERENCES "CanonSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValueChange" ADD CONSTRAINT "ValueChange_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValueChange" ADD CONSTRAINT "ValueChange_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NarrativeCode" ADD CONSTRAINT "NarrativeCode_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NarrativeCode" ADD CONSTRAINT "NarrativeCode_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enigma" ADD CONSTRAINT "Enigma_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetupPayoff" ADD CONSTRAINT "SetupPayoff_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetupPayoff" ADD CONSTRAINT "SetupPayoff_setupSceneId_fkey" FOREIGN KEY ("setupSceneId") REFERENCES "Scene"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetupPayoff" ADD CONSTRAINT "SetupPayoff_payoffSceneId_fkey" FOREIGN KEY ("payoffSceneId") REFERENCES "Scene"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThematicOpposition" ADD CONSTRAINT "ThematicOpposition_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThematicOpposition" ADD CONSTRAINT "ThematicOpposition_themeAId_fkey" FOREIGN KEY ("themeAId") REFERENCES "Theme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThematicOpposition" ADD CONSTRAINT "ThematicOpposition_themeBId_fkey" FOREIGN KEY ("themeBId") REFERENCES "Theme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PacingMetric" ADD CONSTRAINT "PacingMetric_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PacingMetric" ADD CONSTRAINT "PacingMetric_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmotionalState" ADD CONSTRAINT "EmotionalState_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmotionalState" ADD CONSTRAINT "EmotionalState_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CausalRelation" ADD CONSTRAINT "CausalRelation_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CausalRelation" ADD CONSTRAINT "CausalRelation_causeEventId_fkey" FOREIGN KEY ("causeEventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CausalRelation" ADD CONSTRAINT "CausalRelation_effectEventId_fkey" FOREIGN KEY ("effectEventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceProfile" ADD CONSTRAINT "VoiceProfile_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceProfile" ADD CONSTRAINT "VoiceProfile_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudienceKnowledge" ADD CONSTRAINT "AudienceKnowledge_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudienceKnowledge" ADD CONSTRAINT "AudienceKnowledge_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarSystem" ADD CONSTRAINT "CalendarSystem_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MagicSystem" ADD CONSTRAINT "MagicSystem_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorldRule" ADD CONSTRAINT "WorldRule_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Narrator" ADD CONSTRAINT "Narrator_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Focalization" ADD CONSTRAINT "Focalization_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Focalization" ADD CONSTRAINT "Focalization_narratorId_fkey" FOREIGN KEY ("narratorId") REFERENCES "Narrator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Focalization" ADD CONSTRAINT "Focalization_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NarrativeLevel" ADD CONSTRAINT "NarrativeLevel_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "NarrativeLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NarrativeLevel" ADD CONSTRAINT "NarrativeLevel_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenreType" ADD CONSTRAINT "GenreType_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryPattern" ADD CONSTRAINT "StoryPattern_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Manuscript" ADD CONSTRAINT "Manuscript_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Manuscript" ADD CONSTRAINT "Manuscript_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManuscriptSection" ADD CONSTRAINT "ManuscriptSection_manuscriptId_fkey" FOREIGN KEY ("manuscriptId") REFERENCES "Manuscript"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManuscriptSection" ADD CONSTRAINT "ManuscriptSection_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManuscriptSection" ADD CONSTRAINT "ManuscriptSection_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ManuscriptSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Treatment" ADD CONSTRAINT "Treatment_storyWorldId_fkey" FOREIGN KEY ("storyWorldId") REFERENCES "StoryWorld"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

