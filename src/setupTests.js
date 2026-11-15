import { configure } from '@testing-library/react'

// Default waitFor/findBy timeout (1000 ms) is too short when the whole suite
// runs in parallel workers; route transitions can exceed it and fail at random.
configure({ asyncUtilTimeout: 5000 })
