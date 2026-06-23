"use client"

import { useMutation, useQuery } from "convex/react"

import { isConvexConfigured } from "@/components/providers/convex-provider"
import { api } from "@/convex/_generated/api"

export type PromiseRecord = {
  slug: string
  makerAddress: string
  kind?: "promise" | "surprise" | "reveal"
  witnessAddress?: string
  witnessAcceptedAt?: number
  text: string
  dueAt: number
  status: "open" | "done"
  confirmedBy?: string
  completedAt?: number
  createdAt: number
  updatedAt: number
}

export function usePromiseBySlug(slug?: string | null) {
  return useQuery(
    api.promises.getBySlug,
    isConvexConfigured() && slug ? { slug } : "skip",
  )
}

export function useMyPromises(address?: string | null) {
  return useQuery(
    api.promises.listByMaker,
    isConvexConfigured() && address ? { makerAddress: address } : "skip",
  )
}

export function useWitnessPromises(address?: string | null) {
  return useQuery(
    api.promises.listByWitness,
    isConvexConfigured() && address ? { witnessAddress: address } : "skip",
  )
}

export function useAllMyPromises(address?: string | null) {
  return useQuery(
    api.promises.listForUser,
    isConvexConfigured() && address ? { address } : "skip",
  )
}

export function usePromisesBetween(address?: string | null, counterparty?: string | null) {
  return useQuery(
    api.promises.listBetween,
    isConvexConfigured() && address && counterparty
      ? { address, counterparty }
      : "skip",
  )
}

export function useCircleSummary(address?: string | null) {
  return useQuery(
    api.promises.getCircleSummary,
    isConvexConfigured() && address ? { address } : "skip",
  )
}

export function usePromiseMutations() {
  const create = useMutation(api.promises.create)
  const assignWitness = useMutation(api.promises.assignWitness)
  const markDone = useMutation(api.promises.markDone)
  return { create, assignWitness, markDone }
}

export function useThanksMutations() {
  const recordThanks = useMutation(api.thanks.record)
  return { recordThanks }
}

export function useHighFives(address?: string | null) {
  return useQuery(
    api.thanks.getHighFives,
    isConvexConfigured() && address ? { address } : "skip",
  )
}
