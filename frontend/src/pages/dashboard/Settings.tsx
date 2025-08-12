import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { apiClient, type Profile } from "@/lib/api";
import { Edit2, Save, X, User, Shield, Bell, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  // User profile state
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    bio: "",
    two_factor_enabled: false
  });

  const [initialProfileData, setInitialProfileData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    bio: "",
    two_factor_enabled: false
  });

  const [profileLoading, setProfileLoading] = useState(true);

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    autoLogout: "15 minutes",
    loginAlerts: true,
    darkWebMonitoring: true
  });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    securityAlerts: true,
    weeklyReports: false,
    marketingEmails: false
  });

  const [loading, setLoading] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setProfileLoading(true);
        const response = await apiClient.getUserProfile();
        
        if (response.success && response.data) {
          const userData = {
            first_name: response.data.user.first_name || "",
            last_name: response.data.user.last_name || "",
            email: response.data.user.email || "",
            bio: response.data.bio || "",
            two_factor_enabled: response.data.two_factor_enabled || false
          };

          setProfileData(userData);
          setInitialProfileData(userData);
        } else {
          // Fallback to localStorage
          const currentUser = apiClient.getCurrentUser();
          if (currentUser) {
            const userData = {
              first_name: currentUser.first_name || "",
              last_name: currentUser.last_name || "",
              email: currentUser.email || "",
              bio: "",
              two_factor_enabled: false
            };
            setProfileData(userData);
            setInitialProfileData(userData);
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        // Fallback to localStorage
        const currentUser = apiClient.getCurrentUser();
        if (currentUser) {
          const userData = {
            first_name: currentUser.first_name || "",
            last_name: currentUser.last_name || "",
            email: currentUser.email || "",
            bio: "",
            two_factor_enabled: false
          };
          setProfileData(userData);
          setInitialProfileData(userData);
        }
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // For now, just simulate success since we don't have update endpoint yet
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update localStorage user data
      const currentUser = apiClient.getCurrentUser();
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          email: profileData.email
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      toast.success("Profile updated successfully!");
      setEditingProfile(false);
      setInitialProfileData(profileData);
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setProfileData(initialProfileData);
    setEditingProfile(false);
  };

  const handleSecuritySettingChange = (key: string, value: any) => {
    setSecuritySettings(prev => ({ ...prev, [key]: value }));
    toast.success("Security setting updated");
  };

  const handleNotificationSettingChange = (key: string, value: any) => {
    setNotificationSettings(prev => ({ ...prev, [key]: value }));
    toast.success("Notification setting updated");
  };

  const handleToggle2FA = async () => {
    setTwoFactorLoading(true);
    try {
      const response = await apiClient.toggle2FA(!profileData.two_factor_enabled);
      
      if (response.success) {
        const newState = !profileData.two_factor_enabled;
        setProfileData(prev => ({ ...prev, two_factor_enabled: newState }));
        setInitialProfileData(prev => ({ ...prev, two_factor_enabled: newState }));
        
        toast.success(response.message || `2FA ${newState ? 'enabled' : 'disabled'} successfully`);
      } else {
        toast.error(response.error || 'Failed to toggle 2FA');
      }
    } catch (error) {
      toast.error('Failed to toggle 2FA');
      console.error('2FA toggle error:', error);
    } finally {
      setTwoFactorLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application preferences</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Profile Information</CardTitle>
                <p className="text-sm text-muted-foreground">Update your personal information</p>
              </div>
              {!editingProfile && !profileLoading && (
                <Button variant="outline" size="sm" onClick={() => setEditingProfile(true)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {profileLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span className="text-muted-foreground">Loading profile...</span>
                </div>
              ) : editingProfile ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={profileData.first_name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, first_name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profileData.last_name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, last_name: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profileData.bio}
                      onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSaveProfile} disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={handleCancelEdit} disabled={loading}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">First Name</Label>
                      <p className="font-medium">{profileData.first_name || "Not set"}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Last Name</Label>
                      <p className="font-medium">{profileData.last_name || "Not set"}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Email</Label>
                    <p className="font-medium">{profileData.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Bio</Label>
                    <p className="text-sm">{profileData.bio || "No bio set"}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <p className="text-sm text-muted-foreground">Configure your security preferences</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    {profileData.two_factor_enabled 
                      ? "Receive verification codes via email when logging in" 
                      : "Add an extra layer of security to your account"
                    }
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={profileData.two_factor_enabled ? "default" : "secondary"}>
                    {profileData.two_factor_enabled ? "Enabled" : "Disabled"}
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleToggle2FA}
                    disabled={twoFactorLoading}
                  >
                    {twoFactorLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      profileData.two_factor_enabled ? "Disable" : "Enable"
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-logout">Auto-logout after inactivity</Label>
                  <p className="text-sm text-muted-foreground">Automatically sign out when inactive</p>
                </div>
                <Select
                  value={securitySettings.autoLogout}
                  onValueChange={(value) => handleSecuritySettingChange("autoLogout", value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5 minutes">5 minutes</SelectItem>
                    <SelectItem value="15 minutes">15 minutes</SelectItem>
                    <SelectItem value="30 minutes">30 minutes</SelectItem>
                    <SelectItem value="Never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="login-alerts">Login notifications</Label>
                  <p className="text-sm text-muted-foreground">Get notified of new logins</p>
                </div>
                <Switch
                  id="login-alerts"
                  checked={securitySettings.loginAlerts}
                  onCheckedChange={(checked) => handleSecuritySettingChange("loginAlerts", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dark-web">Dark web monitoring</Label>
                  <p className="text-sm text-muted-foreground">Monitor for compromised passwords</p>
                </div>
                <Switch
                  id="dark-web"
                  checked={securitySettings.darkWebMonitoring}
                  onCheckedChange={(checked) => handleSecuritySettingChange("darkWebMonitoring", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <p className="text-sm text-muted-foreground">Choose what notifications you want to receive</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">Email notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive important updates via email</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) => handleNotificationSettingChange("emailNotifications", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="security-alerts">Security alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified of security issues</p>
                </div>
                <Switch
                  id="security-alerts"
                  checked={notificationSettings.securityAlerts}
                  onCheckedChange={(checked) => handleNotificationSettingChange("securityAlerts", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="weekly-reports">Weekly reports</Label>
                  <p className="text-sm text-muted-foreground">Receive weekly security summaries</p>
                </div>
                <Switch
                  id="weekly-reports"
                  checked={notificationSettings.weeklyReports}
                  onCheckedChange={(checked) => handleNotificationSettingChange("weeklyReports", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="marketing-emails">Marketing emails</Label>
                  <p className="text-sm text-muted-foreground">Receive product updates and tips</p>
                </div>
                <Switch
                  id="marketing-emails"
                  checked={notificationSettings.marketingEmails}
                  onCheckedChange={(checked) => handleNotificationSettingChange("marketingEmails", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <p className="text-sm text-muted-foreground">Manage your account settings</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Trusted devices</Label>
                  <p className="text-sm text-muted-foreground">Devices that don't require 2FA</p>
                </div>
                <Button variant="outline" size="sm">
                  Manage Devices
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Export vault data</Label>
                  <p className="text-sm text-muted-foreground">Download your encrypted vault</p>
                </div>
                <Button variant="outline" size="sm">
                  Export
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-destructive">Delete account</Label>
                  <p className="text-sm text-muted-foreground">Permanently delete your account</p>
                </div>
                <Button variant="destructive" size="sm">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
