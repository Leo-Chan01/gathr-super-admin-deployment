import React from 'react'
import UserDetail from '../../components/users/UserDetail'

const UserDetailsPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  return <UserDetail id={id} />
}

export default UserDetailsPage
