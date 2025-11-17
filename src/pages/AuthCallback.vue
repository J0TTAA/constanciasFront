<template>
  <v-app>
    <v-main class="d-flex align-center justify-center pa-6">
      <v-progress-circular :size="64" color="primary" indeterminate />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth0 } from '@auth0/auth0-vue'
import { useAuthStore } from '@/stores/auth'

type Role = 'Estudiante' | 'Secretaria' | 'Director' | 'Administrador'

const router = useRouter()
const auth0 = useAuth0()
const auth = useAuthStore()

const FALLBACK_ROUTE = '/dashboard/solicitudes'

const roleRouteMap: Record<Role, string> = {
  Estudiante: '/dashboard/solicitudes',
  Secretaria: '/dashboard/solicitudes',
  Director: '/dashboard/informes',
  Administrador: '/dashboard/admin',
}

const audience = import.meta.env.VITE_AUTH0_AUDIENCE

async function obtainAccessToken(): Promise<string | null> {
  if (!audience) return null

  try {
    return await auth0.getAccessTokenSilently({ authorizationParams: { audience } })
  } catch (error) {
    console.warn('No se pudo obtener el Access Token de Auth0.', error)
    return null
  }
}

interface ResolvedAuth0Session {
  user: Record<string, unknown>
  idToken: string | null
}

async function resolveAuth0Session(): Promise<ResolvedAuth0Session | null> {
  const claims = (auth0.idTokenClaims.value ??
    null) as unknown as Record<string, unknown> | null

  const userCandidate =
    (auth0.user.value as unknown as Record<string, unknown> | null | undefined) ?? claims

  if (!userCandidate) return null

  const rawFromClaims =
    claims && typeof claims['__raw'] === 'string' ? (claims['__raw'] as string) : null

  const rawFromUser =
    userCandidate && typeof userCandidate['__raw'] === 'string'
      ? (userCandidate['__raw'] as string)
      : null

  const idToken =
    rawFromClaims ??
    rawFromUser ??
    (claims && typeof claims['id_token'] === 'string'
      ? (claims['id_token'] as string)
      : null)

  return {
    user: userCandidate,
    idToken,
  }
}

function resolveRouteForRole(role: Role | null) {
  if (!role) return null
  return roleRouteMap[role]
}

function hasAuthResponseParams() {
  const params = new URLSearchParams(window.location.search)
  return params.has('code') && params.has('state')
}

async function handleAlreadyProcessedSession() {
  const session = await resolveAuth0Session()

  if (!session) {
    auth.clearSession()
    await router.replace({ name: 'login' })
    return
  }

  const accessToken = await obtainAccessToken()
  const effectiveToken = accessToken ?? session.idToken
  auth.setSessionFromAuth0(session.user, effectiveToken)

  const roleRoute = resolveRouteForRole(auth.user?.role ?? null)
  const targetRoute = roleRoute ?? FALLBACK_ROUTE

  await router.replace(targetRoute)
}

onMounted(async () => {
  if (!hasAuthResponseParams()) {
    await router.replace({ name: 'login' })
    return
  }

  try {
    const { appState } = await auth0.handleRedirectCallback()

    const session = await resolveAuth0Session()
    if (!session) {
      throw new Error('No fue posible obtener la información del usuario de Auth0.')
    }

    const accessToken = await obtainAccessToken()
    const effectiveToken = accessToken ?? session.idToken

    auth.setSessionFromAuth0(session.user, effectiveToken)

    const roleRoute = resolveRouteForRole(auth.user?.role ?? null)
    const targetRoute =
      (appState?.returnTo as string | undefined) ?? roleRoute ?? FALLBACK_ROUTE

    await router.replace(targetRoute)
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid state')) {
      await handleAlreadyProcessedSession()
      return
    }

    auth.captureError(error)
    auth.clearSession()
    await router.replace({ name: 'login' })
  }
})
</script>

