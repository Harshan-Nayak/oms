'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password || !role) {
      setError('Please fill in all fields.')
      return
    }

    if (!agreed) {
      setError('Please agree to the Privacy Policy.')
      return
    }

    setLoading(true)

    try {
      // First, sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError('Invalid email or password.')
        return
      }

      if (!authData.user) {
        setError('Login failed. Please try again.')
        return
      }

      // Then verify the user profile and role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (profileError || !profile) {
        setError('User profile not found.')
        return
      }

      if (profile.user_status !== 'Active') {
        setError('Account is inactive. Contact admin.')
        return
      }

      if (profile.user_role !== role) {
        setError('Invalid role selected.')
        return
      }

      // Redirect to main dashboard (all roles use the same dashboard)
      router.push('/dashboard')

    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="w-32 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">Bhaktinandan</span>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Sign into your account
            </CardTitle>
            <CardDescription className="text-gray-600">
              Enter your credentials to access the OMS
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">Select Role</Label>
                <Select value={role}  onValueChange={setRole} required>
                  <SelectTrigger>
                    <SelectValue placeholder="-- Select Role --" />
                  </SelectTrigger>
                  <SelectContent className=" bg-white " >
                    <SelectItem value="User">User</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="***********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="legal" 
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(checked as boolean)}
                  required
                />
                <Label htmlFor="legal" className="text-sm">
                  I agree to the{' '}
                  <button
                    type="button"
                    className="text-blue-600 hover:underline"
                    onClick={() => {
                      // TODO: Open privacy policy modal
                    }}
                  >
                    Privacy Policy
                  </button>
                  .
                </Label>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Login'
                )}
              </Button>
            </form>

            {/* <div className="text-center text-sm mt-4">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-blue-600 hover:underline">
                Sign up here
              </Link>
            </div> */}

            <div className="text-center text-sm text-gray-600 mt-6">
              Made with ❤️{' '}
              <a 
                href="https://vitacoders.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Vitacoders
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
